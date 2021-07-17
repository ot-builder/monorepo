import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { LayoutCommon } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import * as CoverageIdentity from "../coverage";

type MarkGlyphSets = Array<LayoutCommon.Coverage.T<OtGlyph>>;

function testSingle(bim: BimapCtx<OtGlyph>, a: MarkGlyphSets, b: MarkGlyphSets) {
    expect(b.length).toBe(a.length);
    for (const [sa, sb] of ImpLib.Iterators.ZipWithIndex(a, b)) {
        CoverageIdentity.test(bim, sa, sb);
    }
}

export const test = StdCompare(testSingle);
