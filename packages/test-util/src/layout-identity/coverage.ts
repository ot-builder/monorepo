import { OtGlyph } from "@ot-builder/ot-glyphs";
import { LayoutCommon } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../compar-util";

export namespace CoverageIdentity {
    function testSingle(
        bim: BimapCtx<OtGlyph>,
        a: LayoutCommon.Coverage.T<OtGlyph>,
        b: LayoutCommon.Coverage.T<OtGlyph>
    ) {
        for (const glyph of a) expect(b.has(glyph)).toBe(true);
    }

    export const test = StdCompare(testSingle);
}
