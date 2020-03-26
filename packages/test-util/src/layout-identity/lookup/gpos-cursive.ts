import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";

import { GposAnchorIdentity } from "./gpos-shared";

export namespace GposCursiveLookupIdentity {
    function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gpos.Cursive, actual: Gpos.Cursive) {
        for (const [ge, adjE] of expected.attachments) {
            const ga = bmg.forward(ge);
            const adjA = actual.attachments.get(ga) || { entry: null, exit: null };
            GposAnchorIdentity(adjE.entry, adjA.entry);
            GposAnchorIdentity(adjE.exit, adjA.exit);
        }
    }

    export const test = StdCompare(testSingle);
}
