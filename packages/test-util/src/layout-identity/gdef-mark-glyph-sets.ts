import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { LayoutCommon } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../compar-util";

import { CoverageIdentity } from "./coverage";

export namespace GdefMarkGlyphSetsIdentity {
    type MarkGlyphSets = Array<LayoutCommon.Coverage.T<OtGlyph>>;

    function testSingle(bim: BimapCtx<OtGlyph>, a: MarkGlyphSets, b: MarkGlyphSets) {
        expect(b.length).toBe(a.length);
        for (const [sa, sb] of ImpLib.Iterators.ZipWithIndex(a, b)) {
            CoverageIdentity.test(bim, sa, sb);
        }
    }

    export const test = StdCompare(testSingle);
}
