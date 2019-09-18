import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import { FastMatch } from "../../fast-match";

export namespace GsubMultiAltLookupIdentity {
    function testSingle(
        bmg: BimapCtx<OtGlyph>,
        expected: Gsub.Multiple | Gsub.Alternate,
        actual: Gsub.Multiple | Gsub.Alternate
    ) {
        for (const [ga, sa] of expected.mapping) {
            const gb = bmg.forward(ga);
            const sb = actual.mapping.get(gb) || [gb];
            if (sb.length !== sa.length) console.log(ga.name);
            FastMatch.exactly(sb.length, sa.length);
            for (const [sga, sgb] of ImpLib.Iterators.ZipWithIndex(sa, sb)) {
                FastMatch.exactly(sgb, bmg.forward(sga));
            }
        }
    }

    export const test = StdCompare(testSingle);
}
