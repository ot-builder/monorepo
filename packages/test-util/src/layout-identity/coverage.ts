import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { LayoutCommon } from "@ot-builder/ot-layout";

import { type BimapCtx, StdCompare } from "../compar-util";

function testSingle(
    bim: BimapCtx<OtGlyph>,
    a: LayoutCommon.Coverage.T<OtGlyph>,
    b: LayoutCommon.Coverage.T<OtGlyph>
) {
    for (const glyph of a) expect(b.has(glyph)).toBe(true);
}

export const test = StdCompare(testSingle);
