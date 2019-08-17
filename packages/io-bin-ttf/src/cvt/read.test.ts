import { BinaryView } from "@ot-builder/bin-util";
import { Cvt } from "@ot-builder/ft-glyphs";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { CvtIo } from "./index";

test("CVT reading", () => {
    const bufFont = TestFont.get("Scheherazade-Regular.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cvt = new BinaryView(sfnt.tables.get(Cvt.Tag)!).next(CvtIo);
    expect(cvt.items).toEqual([42, 119, 141, 35, 53, 0, 23, -330, 4, 690, 21, 1020, 24]);
});
