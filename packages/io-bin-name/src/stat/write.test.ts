import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Stat } from "@ot-builder/ot-name";
import { TestFont } from "@ot-builder/test-util";

import { StatRead } from "./read";
import { StatWrite } from "./write";

test("Read-write roundtrip : STAT", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntOtf(bufFont);
    const stat = new BinaryView(sfnt.tables.get(Stat.Tag)!).next(StatRead);
    const statBuf1 = Frag.packFrom(StatWrite, stat);
    const stat2 = new BinaryView(statBuf1).next(StatRead);
    expect(stat2).toEqual(stat);
});
