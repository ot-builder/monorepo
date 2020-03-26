import { OtGlyph } from "@ot-builder/ot-glyphs";
import { LayoutCommon } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../compar-util";

export namespace ClassDefIdentity {
    function testSingle(
        bim: BimapCtx<OtGlyph>,
        a: LayoutCommon.ClassDef.T<OtGlyph>,
        b: LayoutCommon.ClassDef.T<OtGlyph>
    ) {
        for (const [glyph, cls] of a) expect(b.get(bim.forward(glyph)) || 0).toBe(cls || 0);
    }

    export const test = StdCompare(testSingle);
}
