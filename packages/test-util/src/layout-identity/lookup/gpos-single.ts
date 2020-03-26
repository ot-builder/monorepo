import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";

import { GposAdjIdentity } from "./gpos-shared";

export namespace GposSingleLookupIdentity {
    function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gpos.Single, actual: Gpos.Single) {
        for (const [ge, adjE] of expected.adjustments) {
            const ga = bmg.forward(ge);
            const adjA = actual.adjustments.get(ga) || Gpos.ZeroAdjustment;
            GposAdjIdentity(adjE, adjA);
        }
    }

    export const test = StdCompare(testSingle);
}
