import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { LayoutCommon } from "@ot-builder/ot-layout";

import { type BimapCtx, StdCompare } from "../compar-util";

function testSingle(
    bim: BimapCtx<OtGlyph>,
    a: LayoutCommon.ClassDef.T<OtGlyph>,
    b: LayoutCommon.ClassDef.T<OtGlyph>,
) {
    for (const [glyph, cls] of a) expect(b.get(bim.forward(glyph)) || 0).toBe(cls || 0);
}

export const test = StdCompare(testSingle);
