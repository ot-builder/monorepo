import { Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { LayoutCommon } from "@ot-builder/ft-layout";

import { CovUtils, GidCoverage } from "../shared/coverage";

type MarkGlyphSets = Array<LayoutCommon.Coverage.T<OtGlyph>>;

export const MarkGlyphSets = {
    ...Read((view, gOrd: OtGlyphOrder) => {
        const format = view.uint16();
        Assert.FormatSupported("MarkGlyphSetsTable::markGlyphSetTableFormat", format, 1);
        const count = view.uint16();
        let ans: MarkGlyphSets = [];
        for (let item = 0; item < count; item++) {
            ans[item] = CovUtils.glyphSetFromGidList(view.ptr32().next(GidCoverage), gOrd);
        }
        return ans;
    }),
    ...Write((frag, markGlyphSets: MarkGlyphSets, gOrd: OtGlyphOrder) => {
        frag.uint16(1);
        frag.uint16(markGlyphSets.length);
        for (const mgs of markGlyphSets) {
            frag.ptr32New().push(GidCoverage, CovUtils.gidListFromGlyphSet(mgs, gOrd));
        }
    })
};
