import { BufferWriter } from "@ot-builder/bin-util";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Tag, UInt16, UInt32 } from "@ot-builder/primitive";

import {
    allocateBlobOffsets,
    BlobStore,
    BufferToSlice,
    collectTableData,
    TableSliceCollection,
    TableRecord
} from "../otf/collector";

export function writeSfntTtcFromTableSlices(sfntList: TableSliceCollection[]) {
    const store: BlobStore = new Map();
    const records: TtcEntry[] = [];
    for (const sfnt of sfntList) {
        const entry: TtcEntry = { sfntVersion: sfnt.version, tableRecords: [] };
        for (const [tag, table] of sfnt.tables)
            entry.tableRecords.push(collectTableData(tag, table, store));
        entry.tableRecords.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
        records.push(entry);
    }
    allocateBlobOffsets(store);

    const ttcHeaderSize = getTtcHeaderSize(sfntList.length);
    let totalHeaderSize = ttcHeaderSize;
    let currentOffsetTableOffset = ttcHeaderSize;
    for (const sr of records) totalHeaderSize += getOffsetTableSize(sr.tableRecords.length);

    const bw = new BufferWriter();
    bw.uint32(tagToUInt32("ttcf"));
    bw.uint16(1);
    bw.uint16(0);
    bw.uint32(sfntList.length);

    for (let fid = 0; fid < records.length; fid++) {
        const rec = records[fid];
        bw.seek(getTtcHeaderSize(fid));
        bw.uint32(currentOffsetTableOffset);
        bw.seek(currentOffsetTableOffset);

        const numTable = rec.tableRecords.length;
        const searchRange = Math.pow(2, Math.floor(Math.log(numTable) / Math.LN2)) * 16;
        const entrySelector = Math.floor(Math.log(numTable) / Math.LN2);
        const rangeShift = numTable * 16 - searchRange;

        bw.uint32(rec.sfntVersion);
        bw.uint16(numTable);
        bw.uint16(searchRange);
        bw.uint16(entrySelector);
        bw.uint16(rangeShift);

        currentOffsetTableOffset += getOffsetTableSize(rec.tableRecords.length);

        for (let k = 0; k < rec.tableRecords.length; k++) {
            const table = rec.tableRecords[k];
            bw.uint32(tagToUInt32(table.tag));
            bw.uint32(table.blob.checksum);
            bw.uint32(totalHeaderSize + table.blob.offset + table.start);
            bw.uint32(table.length);
        }
    }

    for (const blob of store.values()) {
        bw.seek(totalHeaderSize + blob.offset);
        bw.bytes(blob.content);
    }

    return bw.toBuffer();
}

export function writeSfntTtc(sfntList: Sfnt[]) {
    const dss: TableSliceCollection[] = [];
    for (const sfnt of sfntList) {
        const ds: TableSliceCollection = { version: sfnt.version, tables: new Map() };
        for (const [tag, table] of sfnt.tables) ds.tables.set(tag, BufferToSlice(table));
    }
    return writeSfntTtcFromTableSlices(dss);
}

type TtcEntry = {
    sfntVersion: UInt32;
    tableRecords: TableRecord[];
};

// Util functions
function getTtcHeaderSize(numFonts: number) {
    return UInt32.size * 2 + UInt16.size * 2 + UInt32.size * numFonts;
}
function getOffsetTableSize(numTable: number) {
    const headerSize = UInt32.size + UInt16.size * 4;
    const recordSize = Tag.size + UInt32.size * 3;
    return headerSize + numTable * recordSize;
}

function tagToUInt32(x: string) {
    return (
        (x.charCodeAt(0) & 0xff) * 256 * 256 * 256 +
        (x.charCodeAt(1) & 0xff) * 256 * 256 +
        (x.charCodeAt(2) & 0xff) * 256 +
        (x.charCodeAt(3) & 0xff)
    );
}
