import { OtGlyph } from "@ot-builder/ft-glyphs";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Control } from "@ot-builder/prelude";

import { LookupCtx, StdCompare } from "../../compar-util";

export namespace ChainingLookupIdentity {
    function ruleMatch(
        bmg: LookupCtx<OtGlyph, GsubGpos.Lookup>,
        rExp: GsubGpos.ChainingRule,
        rAct: GsubGpos.ChainingRule
    ) {
        if (rExp.match.length !== rAct.match.length) return false;
        if (rExp.inputBegins !== rAct.inputBegins) return false;
        if (rExp.inputEnds !== rAct.inputEnds) return false;
        if (rExp.applications.length !== rAct.applications.length) return false;

        for (let [sa, sb] of Control.ZipWithIndex(rExp.match, rAct.match)) {
            for (const g of sa) if (!sb.has(bmg.glyphs.forward(g))) return false;
            for (const g of sb) if (!sa.has(bmg.glyphs.reward(g))) return false;
        }
        for (const [aa, ab] of Control.ZipWithIndex(rExp.applications, rAct.applications)) {
            if (aa.at !== ab.at) return false;
            if (ab.lookup !== bmg.lookups.forward(aa.lookup)) return false;
        }
        return true;
    }
    function testSingle(
        bmg: LookupCtx<OtGlyph, GsubGpos.Lookup>,
        expected: GsubGpos.ChainingLookup,
        actual: GsubGpos.ChainingLookup
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
