import { Math as OtMath } from "@ot-builder/ot-layout";

import { TestOtlLoop } from "./-shared-test-loop.test";

test("Math - Constants", () => {
    for (const { otl } of TestOtlLoop("Asana-Math.otf")) {
        const { math } = otl;
        if (!math) fail("MATH not present");
        expect(math.constants?.scriptPercentScaleDown).toEqual(73);
        expect(math.constants?.subscriptShiftDown).toEqual({
            value: 210,
            device: [
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                1,
                0,
                0,
                0,
                1,
                1
            ]
        });
        expect(math.constants!.fractionNumeratorGapMin).toEqual({
            value: 116,
            device: [
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                1,
                1,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1
            ]
        });
        expect(math.constants?.radicalDegreeBottomRaisePercent).toEqual(65);
    }
});

test("Math - Glyph info", () => {
    for (const { otl, gOrd } of TestOtlLoop("Asana-Math.otf")) {
        const { math } = otl;
        if (!math) fail("MATH not present");
        expect(math.glyphInfo?.italicCorrections.get(gOrd.at(735))).toEqual({ value: 120 });
        expect(math.glyphInfo?.italicCorrections.get(gOrd.at(3346))).toEqual({ value: 307 });
        expect(math.glyphInfo?.topAccentAttachments.get(gOrd.at(200))).toEqual({ value: -190 });
        expect(math.glyphInfo?.topAccentAttachments.get(gOrd.at(3168))).toEqual({ value: 60 });
        expect(math.glyphInfo?.extendedShapes?.has(gOrd.at(778))).toBeTruthy();
        expect(math.glyphInfo?.extendedShapes?.has(gOrd.at(3446))).toBeTruthy();
        expect(math.glyphInfo?.extendedShapes?.has(gOrd.at(20))).toBeFalsy();
        expect(math.glyphInfo?.kernInfos.get(gOrd.at(35))).toEqual(
            new OtMath.KernInfo(
                new OtMath.Kern({ value: -82 }, []),
                null,
                new OtMath.Kern({ value: 222 }, [[{ value: -200 }, { value: 49 }]]),
                null
            )
        );
        expect(math.glyphInfo?.kernInfos.get(gOrd.at(53))).toEqual(
            new OtMath.KernInfo(
                new OtMath.Kern({ value: 100 }, []),
                null,
                new OtMath.Kern({ value: 49 }, []),
                null
            )
        );
    }
});

test("Math - variants", () => {
    for (const { otl, gOrd } of TestOtlLoop("Asana-Math.otf")) {
        const { math } = otl;
        if (!math) fail("MATH not present");
        expect(math.variants?.minConnectorOverlap).toEqual(100);
        const parenLeft = gOrd.at(10),
            parenBig1 = gOrd.at(3435),
            parenBig2 = gOrd.at(3436),
            parenBig3 = gOrd.at(3437),
            uni239D = gOrd.at(1014),
            uni239C = gOrd.at(1013),
            uni239B = gOrd.at(1012);
        expect(math.variants?.vertical?.get(gOrd.at(10))).toEqual(
            new OtMath.GlyphConstruction(
                new OtMath.GlyphAssembly({ value: 0 }, [
                    new OtMath.GlyphPart(uni239D, 0, 35, 884, OtMath.GlyphPartFlags.None),
                    new OtMath.GlyphPart(uni239C, 15, 15, 326, OtMath.GlyphPartFlags.Extender),
                    new OtMath.GlyphPart(uni239B, 35, 0, 884, OtMath.GlyphPartFlags.None)
                ]),
                [
                    new OtMath.GlyphVariantRecord(parenLeft, 942),
                    new OtMath.GlyphVariantRecord(parenBig1, 1472),
                    new OtMath.GlyphVariantRecord(parenBig2, 2042),
                    new OtMath.GlyphVariantRecord(parenBig3, 2553)
                ]
            )
        );
    }
});
