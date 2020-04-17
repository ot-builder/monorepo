import { BinaryView } from "@ot-builder/bin-util";
import { readSfntBuf } from "@ot-builder/io-bin-sfnt";
import { Stat } from "@ot-builder/ot-name";
import { TestFont } from "@ot-builder/test-util";

import { StatRead } from "./read";

test("Reading : STAT", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntBuf(bufFont);
    const stat = new BinaryView(sfnt.tables.get(Stat.Tag)!).next(StatRead);
    // AXES
    expect(stat.designAxes.length).toBe(2);
    expect(stat.designAxes[0].tag).toBe("wght");
    expect(stat.designAxes[1].tag).toBe("ital");

    // Values
    expect(stat.assignments[0][0]).toBeInstanceOf(Stat.AxisValue.Variable);
    expect(stat.assignments[7][0]).toBeInstanceOf(Stat.AxisValue.Linked);
    expect(stat.assignments[7][1].flags).toBe(2);
    expect(stat.assignments[7][1].valueNameID).toBe(256);
});
