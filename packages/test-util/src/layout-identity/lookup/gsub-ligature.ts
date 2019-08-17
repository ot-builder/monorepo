import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import { FastMatch } from "../../fast-match";

export namespace GsubLigatureLookupIdentity {
    function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gsub.Ligature, actual: Gsub.Ligature) {
        for (const [ge, se] of expected.mapping.entries()) {
            const ga = ge.map(g => bmg.forward(g));
            const sa = actual.mapping.get(ga);
            if (!sa) throw new Error("mapping absent");
            FastMatch.exactly(sa, bmg.forward(se));
        }
    }

    export const test = StdCompare(testSingle);
}
