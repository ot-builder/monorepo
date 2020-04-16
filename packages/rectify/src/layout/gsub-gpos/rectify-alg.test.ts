import * as Ot from "@ot-builder/ot";

import { IdCoordRectifier, IdGlyphRefRectifier } from "../../interface";

import { RectifyGsubGlyphCoordAlg, rectifyLookupList } from "./rectify";

describe("GSUB Rectifier", () => {
    test("Rectify circular link", () => {
        const a = new Ot.Glyph();
        const chaining = new Ot.Gsub.Chaining();
        chaining.rules.push({
            match: [new Set([a])],
            inputBegins: 0,
            inputEnds: 1,
            applications: [{ at: 0, apply: chaining }] // Circular
        });

        const alg = new RectifyGsubGlyphCoordAlg(IdGlyphRefRectifier, IdCoordRectifier, null);
        const correspondence = rectifyLookupList([chaining], alg, fnApplyGsubLookup);

        const chainingDup = correspondence.get(chaining)! as Ot.Gsub.Chaining;
        expect(chainingDup).toBeTruthy();
        expect(chainingDup).not.toBe(chaining);
        expect(chainingDup.rules[0].applications[0].apply).toBe(chainingDup);
    });

    test("Rectify chaining lookup when subsetting font", () => {
        const a = new Ot.Glyph();
        const b = new Ot.Glyph();
        const c = new Ot.Glyph();

        const dummy = new Ot.Gsub.Single({ mapping: new Map([[a, c]]) });
        const chaining = new Ot.Gsub.Chaining();
        chaining.rules.push({
            match: [new Set([c]), new Set([a, b])],
            inputBegins: 1,
            inputEnds: 2,
            applications: [{ at: 0, apply: dummy }]
        });

        const alg = new RectifyGsubGlyphCoordAlg(
            { glyphRef: g => (g === b ? null : g) },
            IdCoordRectifier,
            null
        );

        const correspondence = rectifyLookupList([dummy, chaining], alg, fnApplyGsubLookup);
        const chainingDup = correspondence.get(chaining)! as Ot.Gsub.Chaining;
        expect(chainingDup.rules.length).toBe(1);
        expect(chainingDup.rules[0].match.length).toBe(2);
        expect(chainingDup.rules[0].match[0]).toEqual(new Set([c]));
        expect(chainingDup.rules[0].match[1]).toEqual(new Set([a]));
    });
});

function fnApplyGsubLookup(lookup: Ot.Gsub.Lookup, alg: RectifyGsubGlyphCoordAlg) {
    return alg.process(lookup);
}
