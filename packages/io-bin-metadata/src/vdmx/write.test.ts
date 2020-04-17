import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readSfntBuf } from "@ot-builder/io-bin-sfnt";
import { Vdmx } from "@ot-builder/ot-metadata";
import { TestFont } from "@ot-builder/test-util";

import { VdmxRatioRange, VdmxTableIo } from ".";

test("Writing : VDMX", () => {
    const bufFont = TestFont.get("vdmx.ttf");
    const sfnt = readSfntBuf(bufFont);
    const vdmx = new BinaryView(sfnt.tables.get(Vdmx.Tag)!).next(VdmxTableIo);

    // Read-write roundtrip
    const frVdmx = new Frag().push(VdmxTableIo, vdmx);
    const frVdmxPack = Frag.pack(frVdmx);
    const vdmx2 = new BinaryView(frVdmxPack).next(VdmxTableIo);
    expect(vdmx).toEqual(vdmx2);

    // VdmxGroup sharing check
    const bp = new BinaryView(frVdmxPack);
    bp.uint16(); // `version`
    expect(bp.uint16()).toBe(2); // `numRecords`
    bp.uint16(); // `numRatios`
    bp.next(VdmxRatioRange);
    bp.next(VdmxRatioRange);
    bp.next(VdmxRatioRange);
    const group0Offset = bp.uint16();
    const group1Offset = bp.uint16();
    const group2Offset = bp.uint16();
    expect(group0Offset).toBe(group2Offset);
});
