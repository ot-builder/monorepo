import { TestOtlLoop } from "./-shared-test-loop.test";

test("OTL Integrated Test Loop - Feature Variations", () => {
    for (const { otl } of TestOtlLoop("ZinzinVF.ttf")) {
        const { gsub } = otl;
        if (!gsub) fail("GSUB not present");
        if (!gsub.featureVariations) fail("GSUB feature variations not present");
        expect(gsub.featureVariations.length).toBe(349);

        {
            const fv123 = gsub.featureVariations[123];
            const condition = fv123.conditions[0];
            expect(condition.dim.tag).toBe("SWSH");
            expect(condition.min).toBe(23152 / 0x10000);
            expect(condition.max).toBe(23340 / 0x10000);

            const rvrn = gsub.features.find(f => f.tag === "rvrn")!;

            expect(fv123.substitutions.get(rvrn)).toBeTruthy();
            const substitutedFeature = fv123.substitutions.get(rvrn)!;
            expect(substitutedFeature.lookups.length).toBe(124);
        }
    }
});
