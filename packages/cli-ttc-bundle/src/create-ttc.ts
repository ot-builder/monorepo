import * as Crypto from "crypto";

import { Ot, FontIo } from "ot-builder";

export function createTtc(input: Buffer[], sharing: null | number[][]) {
    const fonts: Ot.Sfnt[] = [];
    for (const file of input) fonts.push(FontIo.readSfntOtf(file));
    if (sharing) shareGlyphs(fonts, sharing);
    return FontIo.writeSfntTtc(fonts);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

type GlyfEntry = {
    head: Buffer;
    loca: Buffer;
    glyf: Buffer;
    glyphData: GlyphData[];
};
type GlyphSharingMap = Map<string, Buffer>;
type GlyphData = { hash: string; buffer: Buffer };

const IndexToLocFormatOffset = 50;

function shareGlyphs(fonts: Ot.Sfnt[], sharing: number[][]) {
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
        const font = fonts[fid];
        const sh = sharing[fid];

        const entryOffsets: number[] = [];
        for (let gid = 0; gid < entry.glyphData.length; gid++) {
            entryOffsets[gid] = glyphOffsets[saGidMaps[sh[gid]].get(entry.glyphData[gid].hash)!];
        }
        entryOffsets.push(glyfTableLength);

        font.tables.set("glyf", glyfBuf);
        font.tables.set("loca", buildLoca(entryOffsets));

        const headBuf = Buffer.from(entry.head);
        headBuf.writeUInt16BE(1, IndexToLocFormatOffset);
        font.tables.set("head", headBuf);
    }
}

function pushGlyph(shared: GlyphSharingMap[], shGid: number, glyphData: GlyphData) {
    if (!shared[shGid]) shared[shGid] = new Map();
    shared[shGid].set(glyphData.hash, glyphData.buffer);
}

function allocateGid(shared: GlyphSharingMap[]) {
    let saGid = 0;
    const saGidMaps: Map<string, number>[] = [];
    const combinedGlyphBuffers: Buffer[] = [];
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
    const offsets: number[] = [];
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

function getGlyphData(fonts: Ot.Sfnt[]) {
    const entries: GlyfEntry[] = [];
    for (let j = 0; j < fonts.length; j++) {
        const font = fonts[j];
        const head = font.tables.get("head");
        const loca = font.tables.get("loca");
        const glyf = font.tables.get("glyf");
        if (!head || !loca || !glyf) throw new TypeError(`Invalid TrueType font.`);
        const glyphData = parseGlyphDataOfFont(head, loca, glyf);
        entries.push({ head, loca, glyf, glyphData });
    }
    return entries;
}

function parseGlyphDataOfFont(head: Buffer, loca: Buffer, glyf: Buffer) {
    const indexToLocFormat = head.readUInt16BE(IndexToLocFormatOffset);
    const bytesPerRecord = indexToLocFormat === 0 ? 2 : 4;
    const offsetCount = loca.byteLength / bytesPerRecord;
    const offsets: number[] = [];
    for (let j = 0; j < offsetCount; j++) {
        if (indexToLocFormat === 0) offsets[j] = 2 * loca.readUInt16BE(bytesPerRecord * j);
        else offsets[j] = loca.readUInt32BE(bytesPerRecord * j);
    }
    const glyphData: GlyphData[] = [];
    for (let j = 0; j < offsets.length - 1; j++) {
        const buf = Buffer.from(alignBufferSize(glyf.slice(offsets[j], offsets[j + 1]), 4));
        glyphData[j] = { hash: computeHashBuf(buf), buffer: buf };
    }
    return glyphData;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function alignBufferSize(buf: Buffer, packing: number) {
    if (packing <= 1) return buf;
    let s = buf.length;
    while (s % packing) s++;
    const buf1 = Buffer.alloc(s);
    buf.copy(buf1);
    return buf1;
}

function computeHashBuf(buffer: Buffer) {
    return Crypto.createHash("sha256").update(buffer).digest("hex");
}
