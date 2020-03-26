import { GsubGpos } from "@ot-builder/ot-layout";

import { TestOtlLoop } from "./-shared-test-loop.test";

test("OTL Integrated Test Loop - Feature Params", () => {
    for (const { otl } of TestOtlLoop("SourceCodeVariable-Roman.ttf")) {
        const { gsub } = otl;
        if (!gsub) fail("GSUB not present");
        {
            const cv01 = gsub.features[2];
            expect(cv01.tag).toBe("cv01");
            expect(cv01.params).toBeTruthy();
            const fpCv = cv01.params!.cast(GsubGpos.FeatureParams.TID_CharacterVariant);
            expect(fpCv).toBeTruthy();
            expect(fpCv!.featUiLabelNameId).toBe(256);
        }
        {
            const ss01 = gsub.features[27];
            expect(ss01.tag).toBe("ss01");
            expect(ss01.params).toBeTruthy();
            const fpSS = ss01.params!.cast(GsubGpos.FeatureParams.TID_StylisticSet);
            expect(fpSS).toBeTruthy();
            expect(fpSS!.uiNameID).toBe(270);
        }
    }
});
