import { Gpos } from "@ot-builder/ot-layout";
import { OtVar } from "@ot-builder/variance";

import { TestOtlLoop } from "./-shared-test-loop.test";

test("OTL Integrated Test Loop - Kerning 1", () => {
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

// prettier-ignore
const TestPairs = [
    "ĄJ", "Ąg", "Ąģ", "Ąj", "Ąȷ", "Qȷ", "ąj", "ąȷ",
    "gȷ", "ģȷ", "ıȷ", "ųȷ", "vȷ", "Va", "Vá", "Vą",
    "Vf", "Vﬂ", "V.", "З‼", "Ҙ₮", "ΛΎ", "ҫ₡", "ъŋ",
    "/,", "/.", "1,", "1.", "3,", "3.", "4,", "4."
];

test("OTL Integrated Test Loop - Kerning 2", () => {
    const round0Results: number[][] = [];
    for (const { round, cmap, otl } of TestOtlLoop("SourceSerifPro-Regular.ttf")) {
        const { gpos } = otl;
        if (!gpos) fail("GPOS/FVAR not present");

        const lookupKern = gpos.lookups[9] as Gpos.Pair;

        for (let pairId = 0; pairId < TestPairs.length; pairId++) {
            const pair = TestPairs[pairId];
            const g1 = cmap.unicode.get(pair.codePointAt(0)!);
            const g2 = cmap.unicode.get(pair.codePointAt(1)!);

            if (!g1 || !g2) continue;

            const [kern] = lookupKern.adjustments.get(g1, g2) || Gpos.ZeroAdjustmentPair;
            const evaluatedKern = [OtVar.Ops.evaluate(kern.dWidth, null)];
            if (round === 0) {
                round0Results[pairId] = evaluatedKern;
            } else {
                expect(evaluatedKern).toEqual(round0Results[pairId]);
            }
        }
    }
});

test("OTL Integrated Test Loop - Kerning 3", () => {
    VariableKerningTestLoop(9, "SourceSerifVariable-Roman.ttf");
});

test("OTL Integrated Test Loop - Kerning 4", () => {
    VariableKerningTestLoop(9, "SourceSerifVariable-Italic.ttf");
});

test("OTL Integrated Test Loop - Kerning 5", () => {
    VariableKerningTestLoop(1, "Inter-V.otf");
});

function VariableKerningTestLoop(lutIndex: number, file: string) {
    const round0Results: number[][] = [];
    for (const { round, cmap, otl, fvar } of TestOtlLoop(file)) {
        const { gpos } = otl;
        if (!gpos || !fvar) fail("GPOS/FVAR not present");

        const wght = fvar.axes[0].dim;
        const thin = new Map([[wght, -1]]);
        const heavy = new Map([[wght, +1]]);

        const lookupKern = gpos.lookups[lutIndex] as Gpos.Pair;

        for (let pairId = 0; pairId < TestPairs.length; pairId++) {
            const pair = TestPairs[pairId];
            const g1 = cmap.unicode.get(pair.codePointAt(0)!);
            const g2 = cmap.unicode.get(pair.codePointAt(1)!);

            if (!g1 || !g2) continue;

            const [kern] = lookupKern.adjustments.get(g1, g2) || Gpos.ZeroAdjustmentPair;
            const evaluatedKern = [
                OtVar.Ops.evaluate(kern.dWidth, null),
                OtVar.Ops.evaluate(kern.dWidth, thin),
                OtVar.Ops.evaluate(kern.dWidth, heavy)
            ];
            if (round === 0) {
                round0Results[pairId] = evaluatedKern;
            } else {
                if (JSON.stringify(evaluatedKern) !== JSON.stringify(round0Results[pairId])) {
                    fail(`Pair '${pair}' mismatch.`);
                }
                expect(evaluatedKern).toEqual(round0Results[pairId]);
            }
        }
    }
}
