import { Gpos } from "@ot-builder/ot-layout";
import { OtVar } from "@ot-builder/variance";

import { TestOtlLoop } from "./-shared-test-loop.test";

test("OTL Integrated Test Loop - Kerning", () => {
    for (const { otl, fvar, gOrd } of TestOtlLoop("SourceSerifVariable-Roman.ttf")) {
        const { gpos } = otl;
        if (!gpos || !fvar) fail("GPOS/FVAR not present");

        const wght = fvar.axes[0].dim;
        const thin = new Map([[wght, -1]]);
        const heavy = new Map([[wght, +1]]);

        const A = gOrd.at(2),
            T = gOrd.at(21),
            V = gOrd.at(23);
        const lookupKern = gpos.lookups[9] as Gpos.Pair;

        const [kernAV] = lookupKern.adjustments.get(A, V) || Gpos.ZeroAdjustmentPair;
        expect(OtVar.Ops.evaluate(kernAV.dWidth, null)).toBe(-120);
        expect(OtVar.Ops.evaluate(kernAV.dWidth, thin)).toBe(-100);
        expect(OtVar.Ops.evaluate(kernAV.dWidth, heavy)).toBe(-100);

        const [kernTA] = lookupKern.adjustments.get(T, A) || Gpos.ZeroAdjustmentPair;
        expect(OtVar.Ops.evaluate(kernTA.dWidth, null)).toBe(-70);
        expect(OtVar.Ops.evaluate(kernTA.dWidth, thin)).toBe(-50);
        expect(OtVar.Ops.evaluate(kernTA.dWidth, heavy)).toBe(-80);
    }
});
