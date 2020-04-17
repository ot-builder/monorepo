import { Read, BinaryView } from "@ot-builder/bin-util";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Tag } from "@ot-builder/primitive";

export function readSfntBuf(buf: Buffer) {
    return readSfntView(new BinaryView(buf));
}
export function readSfntView(view: BinaryView) {
    // Table header
    const version = view.uint32();
    const numTables = view.uint16();
    const _searchRange = view.uint16();
    const _entrySelector = view.uint16();
    const _rangeShift = view.uint16();

    const sfnt = new Sfnt(version);

    for (let mu = 0; mu < numTables; mu++) {
        const tag = view.next(Tag);
        const _checkSum = view.uint32();
        const pTable = view.ptr32();
        const length = view.uint32();
        sfnt.tables.set(tag, pTable.bytes(length));
    }

    return sfnt;
}
