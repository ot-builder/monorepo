import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { Gdef } from "@ot-builder/ot-layout";

import { type BimapCtx, StdCompare } from "../../compar-util";

function testSingle(bim: BimapCtx<OtGlyph>, a: Gdef.AttachPointList, b: Gdef.AttachPointList) {
    for (const [glyph, pl] of a) expect(b.get(bim.forward(glyph))).toEqual(pl);
}

export const test = StdCompare(testSingle);
