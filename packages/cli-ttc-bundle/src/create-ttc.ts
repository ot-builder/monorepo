import * as Crypto from "crypto";

export function createTtc(input: Buffer[], sharing: null | number[][]) {
    const fonts: TtcFontRecord[] = [];
    for (const file of input) fonts.push(readFont(file));
    if (sharing) shareGlyphs(fonts, sharing);
    const { offsetMap, bodyBuffer } = shareTables(fonts);
    return createTtcImpl(fonts, offsetMap, bodyBuffer);
}

function createTtcImpl(
    fonts: TtcFontRecord[],
    offsetMap: Map<string, number>,
    bodyBuffer: Buffer
) {
    const ttcHeaderLength = 12 + 4 * fonts.length;
    const offsetTableLengths = fonts.map(f => 12 + 16 * f.tables.length);
    const initialLength = offsetTableLengths.reduce((a, b) => a + b, ttcHeaderLength);

    const initial = new ArrayBuffer(initialLength);
    const ttcHeader = new DataView(initial, 0);
    ttcHeader.setUint32(0, fromTag("ttcf"), false);
    ttcHeader.setUint16(4, 1, false);
    ttcHeader.setUint16(6, 0, false);
    ttcHeader.setUint32(8, fonts.length, false);

    let currentOffsetTableOffset = ttcHeaderLength;
    for (let j = 0; j < fonts.length; j++) {
        const font = fonts[j];
        ttcHeader.setUint32(12 + 4 * j, currentOffsetTableOffset, false);
        const offsetTable = new DataView(initial, currentOffsetTableOffset, offsetTableLengths[j]);
        currentOffsetTableOffset += offsetTableLengths[j];

        offsetTable.setUint32(0, font.sfntVersion, false);
        offsetTable.setUint16(4, font.numTables, false);
        offsetTable.setUint16(6, font.searchRange, false);
        offsetTable.setUint16(8, font.entrySelector, false);
        offsetTable.setUint16(10, font.rangeShift, false);

        for (let k = 0; k < font.tables.length; k++) {
            const table = font.tables[k];
            const tableRecordOffset = 12 + 16 * k;
            offsetTable.setUint32(tableRecordOffset + 0, fromTag(table.tag), false);
            offsetTable.setUint32(tableRecordOffset + 4, table.checksum, false);
            offsetTable.setUint32(
                tableRecordOffset + 8,
                initialLength + offsetMap.get(table.hash)!,
                false
            );
            offsetTable.setUint32(tableRecordOffset + 12, table.length, false);
        }
    }
    return Buffer.concat([Buffer.from(initial), bodyBuffer]);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

type GlyphSharingMap = Map<string, Buffer>;
type GlyphData = { hash: string; buffer: Buffer };

function shareGlyphs(fonts: TtcFontRecord[], sharing: number[][]) {
    const entries = getGlyphData(fonts);
    const shared: GlyphSharingMap[] = [];
    for (let fid = 0; fid < fonts.length; fid++) {
        const entry = entries[fid];
        const sh = sharing[fid];
        if (entry.glyphData.length !== sh.length)
            throw new Error(`Unreachable! Font #${fid} sharing length mismatch`);
        for (let gid = 0; gid < entry.glyphData.length; gid++) {
            pushGlyph(shared, sh[gid], entry.glyphData[gid]);
        }
    }

    const { saGidMaps, combinedGlyphBuffers } = allocateGid(shared);
    const { glyfBuf, glyphOffsets, glyfTableLength } = buildGlyf(combinedGlyphBuffers);
    for (let fid = 0; fid < fonts.length; fid++) {
        const entry = entries[fid];
        const sh = sharing[fid];

        const entryOffsets = [];
        for (let gid = 0; gid < entry.glyphData.length; gid++) {
            entryOffsets[gid] = glyphOffsets[saGidMaps[sh[gid]].get(entry.glyphData[gid].hash)];
        }
        entryOffsets.push(glyfTableLength);

        entry.glyf.buffer = glyfBuf;
        entry.loca.buffer = buildLoca(entryOffsets);
        entry.head.buffer.writeUInt16BE(1, 50);
    }
}

function pushGlyph(shared: GlyphSharingMap[], shGid: number, glyphData: GlyphData) {
    if (!shared[shGid]) shared[shGid] = new Map();
    shared[shGid].set(glyphData.hash, glyphData.buffer);
}

function allocateGid(shared: GlyphSharingMap[]) {
    let saGid = 0;
    const saGidMaps = [];
    const combinedGlyphBuffers = [];
    for (let shGid = 0; shGid < shared.length; shGid++) {
        if (!shared[shGid]) throw new Error(`Unreachable! Shared glyph #${shGid} missing`);
        saGidMaps[shGid] = new Map();
        for (const [hash, buf] of shared[shGid]) {
            saGidMaps[shGid].set(hash, saGid);
            combinedGlyphBuffers[saGid] = buf;
            saGid++;
        }
    }
    return { saGidMaps, combinedGlyphBuffers };
}

function buildGlyf(shared: Uint8Array[]) {
    let currentOffset = 0;
    const offsets = [];
    for (let sGid = 0; sGid < shared.length; sGid++) {
        if (!shared[sGid]) throw new Error(`Unreachable! Shared glyph #${sGid} missing`);
        offsets[sGid] = currentOffset;
        currentOffset += shared[sGid].byteLength;
    }
    const glyfBuf = Buffer.alloc(currentOffset);
    for (let sGid = 0; sGid < shared.length; sGid++) {
        glyfBuf.set(shared[sGid], offsets[sGid]);
    }
    return { glyfBuf: glyfBuf, glyphOffsets: offsets, glyfTableLength: currentOffset };
}

function buildLoca(offsets: number[]) {
    const buf = Buffer.alloc(offsets.length * 4);
    for (let j = 0; j < offsets.length; j++) {
        buf.writeUInt32BE(offsets[j], j * 4);
    }
    return buf;
}

function getGlyphData(fonts: TtcFontRecord[]) {
    const entries = [];
    for (let j = 0; j < fonts.length; j++) {
        const font = fonts[j];
        let head = null,
            loca = null,
            glyf = null;
        for (const table of font.tables) {
            if (table.tag === "head") head = table;
            if (table.tag === "loca") loca = table;
            if (table.tag === "glyf") glyf = table;
        }
        if (!head || !loca || !glyf) throw new TypeError(`Invalid TrueType font.`);
        const glyphData = parseGlyphDataOfFont(head, loca, glyf);
        entries.push({ head, loca, glyf, glyphData });
    }
    return entries;
}

function parseGlyphDataOfFont(head: TtcTableRecord, loca: TtcTableRecord, glyf: TtcTableRecord) {
    const indexToLocFormat = head.buffer.readUInt16BE(50);
    const bytesPerRecord = indexToLocFormat === 0 ? 2 : 4;
    const offsetCount = loca.buffer.byteLength / bytesPerRecord;
    const offsets = [];
    for (let j = 0; j < offsetCount; j++) {
        if (indexToLocFormat === 0) offsets[j] = 2 * loca.buffer.readUInt16BE(bytesPerRecord * j);
        else offsets[j] = loca.buffer.readUInt32BE(bytesPerRecord * j);
    }
    const glyphData: GlyphData[] = [];
    for (let j = 0; j < offsets.length - 1; j++) {
        const buf = Buffer.from(alignBufferSize(glyf.buffer.slice(offsets[j], offsets[j + 1]), 4));
        glyphData[j] = { hash: computeHashBuf(buf), buffer: buf };
    }
    return glyphData;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function shareTables(fonts: TtcFontRecord[]) {
    const tableMap = new Map<string, TtcTableRecord>();
    for (let j = 0; j < fonts.length; j++) {
        const font = fonts[j];
        // cleanup data
        font.numTables = font.tables.length;
        font.searchRange = Math.pow(2, Math.floor(Math.log(font.numTables) / Math.LN2)) * 16;
        font.entrySelector = Math.floor(Math.log(font.numTables) / Math.LN2);
        font.rangeShift = font.numTables * 16 - font.searchRange;
        font.tables = font.tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

        for (const table of font.tables) {
            table.length = table.buffer.byteLength;
            table.buffer = alignBufferSize(table.buffer, 4);
            table.hash = computeHash(table);
            table.checksum = computeChecksum(table.buffer);

            if (!tableMap.has(table.hash)) {
                tableMap.set(table.hash, table);
            }
        }
    }
    let offset = 0;
    const offsetMap = new Map<string, number>();
    const bodyBlocks = [];
    for (const [hash, content] of tableMap) {
        process.stderr.write(
            `  * ${content.tag} : Offset ${offset} Size ${content.buffer.byteLength}\n`
        );

        offsetMap.set(hash, offset);
        offset += content.buffer.byteLength;
        bodyBlocks.push(Buffer.from(content.buffer));
    }
    return { offsetMap, bodyBuffer: Buffer.concat(bodyBlocks) };
}

function computeChecksum(buffer: Buffer) {
    let checksum = 0;
    for (let j = 0; j * 4 < buffer.byteLength; j++) {
        checksum = (checksum + buffer.readUInt32BE(4 * j)) % 0x100000000;
    }
    return checksum;
}

function computeHash(table: TtcTableRecord) {
    return table.tag + "/" + computeHashBuf(table.buffer);
}
function computeHashBuf(buffer: ArrayBuffer) {
    return Crypto.createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

///////////////////////////////////////////////////////////////////////////////////////////////////

type TtcFontRecord = {
    sfntVersion: number;
    numTables: number;
    searchRange: number;
    entrySelector: number;
    rangeShift: number;
    tables: TtcTableRecord[];
};

function readFont(ab: Buffer) {
    const font: TtcFontRecord = {
        sfntVersion: ab.readUInt32BE(0),
        numTables: ab.readUInt16BE(4),
        searchRange: ab.readUInt16BE(6),
        entrySelector: ab.readUInt16BE(8),
        rangeShift: ab.readUInt16BE(10),
        tables: []
    };
    for (let j = 0; j < font.numTables; j++) {
        font.tables[j] = readTableRecord(ab, 12 + j * 16);
    }
    return font;
}

type TtcTableRecord = {
    tag: string;
    length: number;
    hash: string;
    checksum: number;
    buffer: Buffer;
};

function readTableRecord(buf: Buffer, offset: number): TtcTableRecord {
    const tableOffset = buf.readUInt32BE(offset + 8);
    const tableLength = buf.readUInt32BE(offset + 12);
    return {
        tag: toTag(buf.readUInt32BE(offset + 0)),
        length: tableLength,
        checksum: 0,
        hash: "",
        buffer: buf.slice(tableOffset, tableOffset + tableLength)
    };
}

function fromTag(x: string) {
    return (
        (x.charCodeAt(0) & 0xff) * 256 * 256 * 256 +
        (x.charCodeAt(1) & 0xff) * 256 * 256 +
        (x.charCodeAt(2) & 0xff) * 256 +
        (x.charCodeAt(3) & 0xff)
    );
}

function toTag(x: number) {
    return (
        String.fromCharCode((x >>> 24) & 0xff) +
        String.fromCharCode((x >>> 16) & 0xff) +
        String.fromCharCode((x >>> 8) & 0xff) +
        String.fromCharCode((x >>> 0) & 0xff)
    );
}

function alignBufferSize(buf: Buffer, packing: number) {
    if (packing <= 1) return buf;
    let s = buf.length;
    while (s % packing) s++;
    const buf1 = Buffer.alloc(s);
    buf.copy(buf1);
    return buf1;
}
