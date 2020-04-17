import { BinaryView } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Tag } from "@ot-builder/primitive";

export function readSfntTtcView(view: BinaryView) {
    const sfntList: Sfnt[] = [];

    const _ttcTag = view.uint32();
    const majorVersion = view.uint16();
    const minorVersion = view.uint16();
    Assert.SubVersionSupported("TTC", majorVersion, minorVersion, [1, 0], [2, 0]);
    const numFonts = view.uint32();

    for (let fid = 0; fid < numFonts; fid++) {
        const vSfnt = view.lift(view.uint32());

        const version = vSfnt.uint32();
        const numTables = vSfnt.uint16();
        const _searchRange = vSfnt.uint16();
        const _entrySelector = vSfnt.uint16();
        const _rangeShift = vSfnt.uint16();

        const sfnt = new Sfnt(version);

        for (let mu = 0; mu < numTables; mu++) {
            const tag = vSfnt.next(Tag);
            const _checkSum = vSfnt.uint32();
            const tableOffset = vSfnt.uint32();
            const length = vSfnt.uint32();
            sfnt.tables.set(tag, view.lift(tableOffset).bytes(length));
        }

        sfntList.push(sfnt);
    }
    return sfntList;
}

export function readSfntTtc(buf: Buffer) {
    return readSfntTtcView(new BinaryView(buf));
}
