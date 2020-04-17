import * as Crypto from "crypto";

import { FontIo } from "ot-builder";

import {
    buildDataBlock,
    buildOffsetIndex,
    DataBlockBuildResults,
    GlyphData,
    GlyphSharingMap,
    pushGlyphs
} from "./sparse-common";

type GlyfTask = {
    fontID: number;
    head: FontIo.TableSlice;
    loca: FontIo.TableSlice;
    glyf: FontIo.TableSlice;
    glyphData: GlyphData[];
};

const IndexToLocFormatOffset = 50;

export function sparseShareGlyfData(fonts: FontIo.TableSliceCollection[], sharing: number[][]) {
    const tasks = getGlyfTasks(fonts);
    if (!tasks.length) return;

    const shared: GlyphSharingMap[] = [];
    for (const task of tasks) {
        pushGlyphs(shared, task.fontID, task.glyphData, sharing);
    }

    const db = buildDataBlock(shared);
    for (const task of tasks) {
        const locaBuf = taskToLocaBuf(task, sharing, db);

        task.glyf.data = db.dataBlock;
        task.glyf.length = db.dataBlock.byteLength;
        task.glyf.start = 0;
        task.loca.data = locaBuf;
        task.loca.length = locaBuf.byteLength;
        task.loca.start = 0;
        task.head.data.writeUInt16BE(1, IndexToLocFormatOffset);
    }
}

function taskToLocaBuf(entry: GlyfTask, sharing: number[][], db: DataBlockBuildResults) {
    const sh = sharing[entry.fontID];
    const entryOffsets: number[] = [];
    for (let gid = 0; gid < entry.glyphData.length; gid++) {
        entryOffsets[gid] = db.offsets[db.saGidMaps[sh[gid]].get(entry.glyphData[gid].hash)!];
    }
    entryOffsets.push(db.dataBlock.byteLength);
    const locaBuf = buildOffsetIndex(entryOffsets, true);
    return locaBuf;
}

function getGlyfTasks(fonts: FontIo.TableSliceCollection[]) {
    const entries: GlyfTask[] = [];
    for (let fid = 0; fid < fonts.length; fid++) {
        const font = fonts[fid];
        const head = font.tables.get("head");
        const loca = font.tables.get("loca");
        const glyf = font.tables.get("glyf");
        if (!head || !loca || !glyf) continue;
        const glyphData = parseGlyphData(head, loca, glyf);
        entries.push({ fontID: fid, head, loca, glyf, glyphData });
    }
    return entries;
}

function parseGlyphData(
    head: FontIo.TableSlice,
    loca: FontIo.TableSlice,
    glyf: FontIo.TableSlice
) {
    const indexToLocFormat = head.data.readUInt16BE(IndexToLocFormatOffset);
    const bytesPerRecord = indexToLocFormat === 0 ? 2 : 4;
    const offsetCount = loca.data.byteLength / bytesPerRecord;
    const offsets: number[] = [];
    for (let j = 0; j < offsetCount; j++) {
        if (indexToLocFormat === 0) offsets[j] = 2 * loca.data.readUInt16BE(bytesPerRecord * j);
        else offsets[j] = loca.data.readUInt32BE(bytesPerRecord * j);
    }
    const glyphData: GlyphData[] = [];
    for (let j = 0; j < offsets.length - 1; j++) {
        const buf = glyf.data.slice(offsets[j], offsets[j + 1]);
        if (buf.length % 4) throw new Error("Unreachable! Glyf data blocks should be aligned.");
        glyphData[j] = { hash: computeHashBuf(buf), buffer: buf };
    }
    return glyphData;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function computeHashBuf(buffer: Buffer) {
    return Crypto.createHash("sha256").update(buffer).digest("hex");
}
