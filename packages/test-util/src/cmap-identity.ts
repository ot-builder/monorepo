import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyph } from "@ot-builder/ft-glyphs";

import { BimapCtx, StdCompare } from "./compar-util";

export namespace CmapIdentity {
    function testSingle(bim: BimapCtx<OtGlyph>, a: Cmap.Table, b: Cmap.Table) {
        for (const [code, glyph] of a.unicode.entries()) {
            expect(b.unicode.get(code)).toBe(bim.forward(glyph));
        }
        for (const [code, selector, glyph] of a.vs.entries()) {
            expect(b.vs.get(code, selector)).toBe(bim.forward(glyph));
        }
    }

    // tslint:disable-next-line: ext-variable-name
    export const test = StdCompare(testSingle);
}
