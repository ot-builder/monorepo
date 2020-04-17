import { BufferWriter, Frag } from "@ot-builder/bin-util";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Tag, UInt16, UInt32 } from "@ot-builder/primitive";

import {
    allocateBlobOffsets,
    BlobStore,
    BufferToSlice,
    calculateChecksum,
    collectTableData,
    TableRecord
} from "./collector";

function offsetTableSize(numTable: number) {
    const headerSize = UInt32.size + UInt16.size * 4;
    const recordSize = Tag.size + UInt32.size * 3;
    return headerSize + numTable * recordSize;
}

// Reference
//  - https://docs.microsoft.com/en-us/typography/opentype/spec/otff#calculating-checksums
function fixHeadChecksum(bw: BufferWriter, headOffset: number) {
    bw.seek(bw.length);
    while (bw.length % 4) bw.uint8(0);
    bw.seek(headOffset + 8);
    bw.uint32(0);
    const fontChecksum = calculateChecksum(bw.toBuffer());
    bw.seek(headOffset + 8);
    bw.uint32(UInt32.from(0xb1b0afba - fontChecksum));
}

export function writeSfntBuf(sfnt: Sfnt) {
    const store: BlobStore = new Map();

    const numTable = sfnt.tables.size;
    const searchRange = Math.pow(2, Math.floor(Math.log(numTable) / Math.LN2)) * 16;
    const entrySelector = Math.floor(Math.log(numTable) / Math.LN2);
    const rangeShift = numTable * 16 - searchRange;
    const headerSize = offsetTableSize(numTable);

    const records: TableRecord[] = [];
    for (const [tag, table] of sfnt.tables) {
        records.push(collectTableData(tag, BufferToSlice(table), store));
    }
    records.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
    allocateBlobOffsets(store);

    const bw = new BufferWriter();
    bw.uint32(sfnt.version);
    bw.uint16(numTable);
    bw.uint16(searchRange);
    bw.uint16(entrySelector);
    bw.uint16(rangeShift);

    let headOffset = 0;

    for (const record of records) {
        if (record.tag === "head") headOffset = headerSize + record.blob.offset;
        bw.bytes(Frag.pack(new Frag().push(Tag, record.tag)));
        bw.uint32(record.blob.checksum);
        bw.uint32(headerSize + record.blob.offset + record.start);
        bw.uint32(record.length);
    }

    for (const blob of store.values()) {
        bw.seek(headerSize + blob.offset);
        bw.bytes(blob.content);
    }

    fixHeadChecksum(bw, headOffset);

    return bw.toBuffer();
}
