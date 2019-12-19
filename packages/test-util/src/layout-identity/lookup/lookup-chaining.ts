import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { GsubGpos } from "@ot-builder/ft-layout";

import { LookupCtx, StdCompare } from "../../compar-util";

export namespace ChainingLookupIdentity {
    function ruleMatch<L>(
        bmg: LookupCtx<OtGlyph, L>,
        rExp: GsubGpos.ChainingRule<L>,
        rAct: GsubGpos.ChainingRule<L>
    ) {
        if (rExp.match.length !== rAct.match.length) return false;
        if (rExp.inputBegins !== rAct.inputBegins) return false;
        if (rExp.inputEnds !== rAct.inputEnds) return false;
        if (rExp.applications.length !== rAct.applications.length) return false;

        for (let [sa, sb] of ImpLib.Iterators.ZipWithIndex(rExp.match, rAct.match)) {
            for (const g of sa) if (!sb.has(bmg.glyphs.forward(g))) return false;
            for (const g of sb) if (!sa.has(bmg.glyphs.reward(g))) return false;
        }
        for (const [aa, ab] of ImpLib.Iterators.ZipWithIndex(
            rExp.applications,
            rAct.applications
        )) {
            if (aa.at !== ab.at) return false;
            if (ab.apply !== bmg.lookups.forward(aa.apply)) return false;
        }
        return true;
    }
    function testSingle<L>(
        bmg: LookupCtx<OtGlyph, L>,
        expected: GsubGpos.ChainingProp<L>,
        actual: GsubGpos.ChainingProp<L>
    ) {
        for (const rExp of expected.rules) {
            let foundMatchRule = false;
            for (const rAct of actual.rules) {
                if (ruleMatch(bmg, rExp, rAct)) foundMatchRule = true;
            }
            expect(foundMatchRule).toBe(true);
        }
    }

    export const test = StdCompare(testSingle);
}
