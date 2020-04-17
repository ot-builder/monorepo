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

type GvarTask = {
    fontID: number;
    table: FontIo.TableSlice;
    headerSlice: Buffer;
    sharedTupleSlice: Buffer;
    glyphData: GlyphData[];
};

// Layout:                             Viewed from font 1        Viewed font font 2
// [GVAR header of font 1   ] ◆──╮   ⎡GVAR header       ⎤
// [Shared tuples of font 1 ] ◁──┤   ⎢Shared tuples     ⎥
// [GVD #0 of font 1        ] ◁──╯   ⎢GVD of glyph 0    ⎥
// [GVAR header of font 2   ] ◆──╮   ⎢                  ⎥      ⎡GVAR header       ⎤
// [Shared tuples of font 2 ] ◁──┤   ⎢                  ⎥      ⎢Shared tuples     ⎥
// [GVD #0 of font 2        ] ◁──╯   ⎢    L A R G E     ⎥      ⎢GVD of glyph 0    ⎥
//  .......................           ⎢                  ⎥      ⎢                  ⎥
//  .......................           ⎢      G A P       ⎥      ⎢    L A R G E     ⎥
//  .......................           ⎢                  ⎥      ⎢      G A P       ⎥
//  .......................           ⎢                  ⎥      ⎢                  ⎥
// [GVD of #0 of all fonts  ] ─────── ⎢── Ignored      ──⎥ ──── ⎢── Ignored      ──⎥
// [GVD of other glyphs     ]         ⎣GVD of rest glyphs⎦      ⎣GVD of rest glyphs⎦
//
// Why duplicate the GVD of first glyph in each font? Because many font engines
// require that shared tuple list occurs right after the header, and GVD occurs
// right after shared tuple list. So we have to use the gap between GVDs to
// interlace tables together.

export function sparseShareGvarData(fonts: FontIo.TableSliceCollection[], sharing: number[][]) {
    const tasks = getGvarTasks(fonts, sharing);
    if (!tasks.length) return;

    const shared: GlyphSharingMap[] = [];
    for (const task of tasks) {
        pushGlyphs(shared, task.fontID, task.glyphData, sharing);
    }

    const db: DataBlockBuildResults = buildDataBlock(shared);

    let totalInitialSize = 0;
    for (const task of tasks) totalInitialSize += gvarInitialSize(task);
    const backBuffer = Buffer.alloc(totalInitialSize + db.dataBlock.byteLength);
    db.dataBlock.copy(backBuffer, totalInitialSize);

    let start = 0;
    for (const task of tasks) {
        const offsetLoca = start + task.headerSlice.byteLength;
        const offsetSharedTuples = offsetLoca + 4 * (task.glyphData.length + 1);
        const offsetFirstGvd = offsetSharedTuples + task.sharedTupleSlice.byteLength;

        const locaBuf = taskToLocaBuf(task, sharing, db, totalInitialSize - offsetFirstGvd);

        // Data copying
        task.headerSlice.copy(backBuffer, start);
        locaBuf.copy(backBuffer, offsetLoca);
        task.sharedTupleSlice.copy(backBuffer, offsetSharedTuples);
        task.glyphData[0].buffer.copy(backBuffer, offsetFirstGvd);

        // Amend pointers and flags
        backBuffer.writeUInt16BE(1, start + GvarFlagsOffset);
        backBuffer.writeUInt32BE(offsetSharedTuples - start, start + GvarSharedTuplesOffsetOffset);
        backBuffer.writeUInt32BE(offsetFirstGvd - start, start + GvarGvdOffsetOffset);

        // Store back
        task.table.data = backBuffer;
        task.table.start = start;
        task.table.length = backBuffer.byteLength - start;

        start += gvarInitialSize(task);
    }
}

function taskToLocaBuf(
    task: GvarTask,
    sharing: number[][],
    db: DataBlockBuildResults,
    deltaOffsetOfRest: number
) {
    const sh = sharing[task.fontID];

    const entryOffsets: number[] = [];
    for (let gid = 0; gid < task.glyphData.length; gid++) {
        entryOffsets[gid] = db.offsets[db.saGidMaps[sh[gid]].get(task.glyphData[gid].hash)!];
    }
    entryOffsets.push(db.dataBlock.byteLength);

    // Amend the offsets
    entryOffsets[0] = 0;
    for (let gid = 1; gid < entryOffsets.length; gid++) {
        entryOffsets[gid] += deltaOffsetOfRest;
    }

    return buildOffsetIndex(entryOffsets, false);
}

function gvarInitialSize(task: GvarTask) {
    let s =
        8 +
        task.headerSlice.byteLength +
        4 * task.glyphData.length +
        task.sharedTupleSlice.byteLength +
        task.glyphData[0].buffer.byteLength;
    while (s % 4) s++;
    return s;
}

function getGvarTasks(fonts: FontIo.TableSliceCollection[], sharing: number[][]) {
    const results: GvarTask[] = [];

    for (let fid = 0; fid < fonts.length; fid++) {
        const font = fonts[fid];
        const gvar = font.tables.get("gvar");
        if (!gvar) continue;
        results.push(produceGvarTask(fid, gvar));
    }
    return results;
}

const GvarHeaderSize = 2 * 6 + 4 * 2;
const GvarSharedTuplesOffsetOffset = 8;
const GvarFlagsOffset = 14;
const GvarGvdOffsetOffset = 16;

function produceGvarTask(fontID: number, table: FontIo.TableSlice): GvarTask {
    const headerSlice = Buffer.from(table.data.slice(0, GvarHeaderSize));

    const axisCount = headerSlice.readUInt16BE(4);
    const sharedTupleCount = headerSlice.readUInt16BE(6);
    const sharedTuplesOffset = headerSlice.readUInt32BE(GvarSharedTuplesOffsetOffset);
    const sharedTupleSlice = Buffer.from(
        table.data.slice(sharedTuplesOffset, sharedTuplesOffset + 2 * axisCount * sharedTupleCount)
    );

    const glyphCount = headerSlice.readUInt16BE(12);
    const flags = headerSlice.readUInt16BE(GvarFlagsOffset);
    const gvdOffset = headerSlice.readUInt32BE(GvarGvdOffsetOffset);

    const useLongOffset = !!(flags & 1);

    const offsets: number[] = [];
    for (let j = 0; j <= glyphCount; j++) {
        if (useLongOffset) {
            offsets[j] = table.data.readUInt32BE(GvarHeaderSize + 4 * j);
        } else {
            offsets[j] = 2 * table.data.readUInt16BE(GvarHeaderSize + 2 * j);
        }
    }

    const glyphData: GlyphData[] = [];
    for (let j = 0; j < glyphCount; j++) {
        const offset = offsets[j],
            size = offsets[j + 1] - offsets[j];
        if (!size || size % 4) throw new Error("Unreachable! Gvar data blocks should be aligned");
        const buf = table.data.slice(gvdOffset + offset, gvdOffset + offset + size);
        glyphData[j] = { hash: computeHashBuf(buf), buffer: buf };
    }

    return { fontID, table, headerSlice, sharedTupleSlice, glyphData };
}
function computeHashBuf(buffer: Buffer) {
    return Crypto.createHash("sha256").update(buffer).digest("hex");
}
