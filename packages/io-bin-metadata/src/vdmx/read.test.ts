import { BinaryView } from "@ot-builder/bin-util";
import { Vdmx } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { VdmxTableIo } from ".";

test("Reading : VDMX", () => {
    const bufFont = TestFont.get("vdmx.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const vdmx = new BinaryView(sfnt.tables.get(Vdmx.Tag)!).next(VdmxTableIo);

    expect(vdmx.version).toBe(1);
    expect(vdmx.records.length).toBe(3);

    const nonUniformRatio = vdmx.records[1].ratioRange;
    expect(nonUniformRatio.xRatio).toBe(2);
    expect(nonUniformRatio.yStartRatio).toBe(1);
    expect(nonUniformRatio.yEndRatio).toBe(2);

    const defaultGroup = vdmx.records[0].entries;
    expect(defaultGroup.get(8)!.yMax).toBe(8);
    expect(defaultGroup.get(16)!.yMin).toBe(-8);
});
