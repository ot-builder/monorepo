import { Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import { CovUtils, GidCoverage } from "../shared/coverage";

type MarkGlyphSets = Array<Gdef.Coverage>;

export const MarkGlyphSets = {
    ...Read((view, gOrd: Data.Order<OtGlyph>) => {
        const format = view.uint16();
        Assert.FormatSupported("MarkGlyphSetsTable::markGlyphSetTableFormat", format, 1);
        const count = view.uint16();
        const ans: MarkGlyphSets = [];
        for (let item = 0; item < count; item++) {
            ans[item] = CovUtils.glyphSetFromGidList(view.ptr32().next(GidCoverage), gOrd);
        }
        return ans;
    }),
    ...Write((frag, markGlyphSets: MarkGlyphSets, gOrd: Data.Order<OtGlyph>) => {
        frag.uint16(1);
        frag.uint16(markGlyphSets.length);
        for (const mgs of markGlyphSets) {
            frag.ptr32New().push(GidCoverage, CovUtils.gidListFromGlyphSet(mgs, gOrd));
        }
    })
};
