import * as Ot from "@ot-builder/font";

import { RectifyGlyphCoordAlg, rectifyLookupList } from "./rectify-alg";

describe("GSUB Rectifier", () => {
    test("Rectify circular link", () => {
        const a = Ot.Glyph.create();
        const chaining = Ot.Gsub.Chaining.create();
        chaining.rules.push({
            match: [new Set([a])],
            inputBegins: 0,
            inputEnds: 1,
            applications: [{ at: 0, apply: chaining }] // Circular
        });
        const correspondence = rectifyLookupList([chaining], createDuplicateAlg());

        const chainingDup = correspondence.get(chaining)! as Ot.Gsub.Chaining;
        expect(chainingDup).toBeTruthy();
        expect(chainingDup).not.toBe(chaining);
        expect(chainingDup.rules[0].applications[0].apply).toBe(chainingDup);
    });
});

function createDuplicateAlg() {
    return new RectifyGlyphCoordAlg({ glyph: g => g }, { coord: x => x, cv: x => x }, null);
}
