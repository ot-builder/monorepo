import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { BimapCtx, StdCompare } from "../../compar-util";
import * as FastMatch from "../../fast-match";

function getOffset(mre: Data.Maybe<Gpos.MarkRecord>, bre: Data.Maybe<Gpos.BaseRecord>) {
    let offsetX = OtVar.Ops.neutral;
    let offsetY = OtVar.Ops.neutral;
    if (mre && bre) {
        for (let mc = 0; mc < mre.markAnchors.length; mc++) {
            const markAnchor = mre.markAnchors[mc];
            const baseAnchor = bre.baseAnchors[mc];
            if (!markAnchor || !baseAnchor) continue;
            offsetX = OtVar.Ops.minus(baseAnchor.x, markAnchor.x);
            offsetY = OtVar.Ops.minus(baseAnchor.y, markAnchor.y);
        }
    }
    return { x: offsetX, y: offsetY };
}

function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gpos.MarkToBase, actual: Gpos.MarkToBase) {
    for (const [gme, mre] of expected.marks) {
        for (const [gbe, bre] of expected.bases) {
            const offsetExpected = getOffset(mre, bre);
            const offsetActual = getOffset(
                actual.marks.get(bmg.forward(gme)),
                actual.bases.get(bmg.forward(gbe))
            );
            FastMatch.otvar(offsetExpected.x, offsetActual.x, `${gme.name} >< ${gbe.name} / x`);
            FastMatch.otvar(offsetExpected.y, offsetActual.y, `${gme.name} >< ${gbe.name} / y`);
        }
    }
}

export const test = StdCompare(testSingle);
