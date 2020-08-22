import { BinaryView } from "@ot-builder/bin-util";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Vdmx } from "@ot-builder/ot-metadata";
import { TestFont } from "@ot-builder/test-util";

import { VdmxTableIo } from "./index";

test("Reading : VDMX", () => {
    const bufFont = TestFont.get("vdmx.ttf");
    const sfnt = readSfntOtf(bufFont);
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
