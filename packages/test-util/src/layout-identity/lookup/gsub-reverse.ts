import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gsub } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";

export namespace GsubReverseLookupIdentity {
    function ruleMatch(bmg: BimapCtx<OtGlyph>, rExp: Gsub.ReverseRule, rAct: Gsub.ReverseRule) {
        if (rExp.match.length !== rAct.match.length) return false;
        if (rExp.doSubAt !== rAct.doSubAt) return false;

        for (const [sa, sb] of ImpLib.Iterators.ZipWithIndex(rExp.match, rAct.match)) {
            for (const g of sa) if (!sb.has(bmg.forward(g))) return false;
            for (const g of sb) if (!sa.has(bmg.reward(g))) return false;
        }
        const igsExp = rExp.match[rExp.doSubAt];
        const igsAct = rAct.match[rAct.doSubAt];
        for (const sgExp of igsExp) {
            const tgExp = rExp.replacement.get(sgExp) || sgExp;
            const sgAct = bmg.forward(sgExp);
            const tgAct = rAct.replacement.get(sgAct) || sgAct;
            if (tgExp !== tgAct) return false;
        }
        return true;
    }
    function testSingle(
        bmg: BimapCtx<OtGlyph>,
        expected: Gsub.ReverseSub,
        actual: Gsub.ReverseSub
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
