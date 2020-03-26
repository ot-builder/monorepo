import { BinaryView } from "@ot-builder/bin-util";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Maxp } from "@ot-builder/ot-metadata";
import { TestFont } from "@ot-builder/test-util";

import { MaxpIo } from "./index";

test("Reading : maxp", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const maxp = new BinaryView(sfnt.tables.get(Maxp.Tag)!).next(MaxpIo);
    expect(maxp.numGlyphs).toBe(1465);
});
