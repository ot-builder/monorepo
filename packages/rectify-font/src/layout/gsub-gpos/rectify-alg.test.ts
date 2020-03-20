import * as Ot from "@ot-builder/font";

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
        const correspondence = rectifyLookupList(
            [chaining],
            createDuplicateAlg(),
            fnApplyGsubLookup
        );

        const chainingDup = correspondence.get(chaining)! as Ot.Gsub.Chaining;
        expect(chainingDup).toBeTruthy();
        expect(chainingDup).not.toBe(chaining);
        expect(chainingDup.rules[0].applications[0].apply).toBe(chainingDup);
    });
});

function createDuplicateAlg() {
    return new RectifyGsubGlyphCoordAlg({ glyphRef: g => g }, { coord: x => x, cv: x => x }, null);
}
function fnApplyGsubLookup(lookup: Ot.Gsub.Lookup, alg: RectifyGsubGlyphCoordAlg) {
    return alg.process(lookup);
}
