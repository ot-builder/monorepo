import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import { FastMatch } from "../../fast-match";

export namespace GsubSingleLookupIdentity {
    function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gsub.Single, actual: Gsub.Single) {
        for (const [ga, sa] of expected.mapping) {
            const gb = bmg.forward(ga);
            const sb = actual.mapping.get(gb) || gb;
            FastMatch.exactly(sb, bmg.forward(sa));
        }
    }

    export const test = StdCompare(testSingle);
}
