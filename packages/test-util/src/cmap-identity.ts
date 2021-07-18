import { Cmap } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";

import { BimapCtx, StdCompare } from "./compar-util";

function testSingle(bim: BimapCtx<OtGlyph>, a: Cmap.Table, b: Cmap.Table) {
    for (const [code, glyph] of a.unicode.entries()) {
        if (b.unicode.get(code) !== bim.forward(glyph)) {
            fail(`CMAP mapping for ${code.toString(16)} mismatch`);
            return;
        }
    }
    for (const [code, selector, glyph] of a.vs.entries()) {
        expect(b.vs.get(code, selector)).toBe(bim.forward(glyph));
    }
}
export const test = StdCompare(testSingle);
