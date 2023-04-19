import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import * as FastMatch from "../../fast-match";

import { getOffset } from "./gpos-mark-to-base";

function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gpos.MarkToMark, actual: Gpos.MarkToMark) {
    for (const [gme, mre] of expected.marks) {
        for (const [gbe, bre] of expected.baseMarks) {
            const offsetExpected = getOffset(mre, bre);
            const offsetActual = getOffset(
                actual.marks.get(bmg.forward(gme)),
                actual.baseMarks.get(bmg.forward(gbe))
            );
            FastMatch.otvar(offsetExpected.x, offsetActual.x, `${gme.name} >< ${gbe.name} / x`);
            FastMatch.otvar(offsetExpected.y, offsetActual.y, `${gme.name} >< ${gbe.name} / y`);
        }
    }
}

export const test = StdCompare(testSingle);
