import * as Ot from "@ot-builder/ot";

import {
    IdAxisRectifier,
    IdCoordRectifier,
    IdGlyphRefRectifier,
    IdPointAttachmentRectifier
} from "../../interface";

import { RectifyGsubGlyphCoordAlg, rectifyLookupList } from "./rectify";

import { rectifyGsubTable } from ".";

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

    test("Rectify chaining lookup when the inner lookup get cleared 1", () => {
        const a = new Ot.Glyph();
        const b = new Ot.Glyph();
        const c = new Ot.Glyph();

        const dummy1 = new Ot.Gsub.Single({ mapping: new Map([[a, c]]) });
        const dummy2 = new Ot.Gsub.Single({ mapping: new Map([[a, b]]) });

        const chaining = new Ot.Gsub.Chaining();
        chaining.rules.push({
            match: [new Set([a]), new Set([a, b])],
            inputBegins: 0,
            inputEnds: 2,
            applications: [
                { at: 0, apply: dummy1 },
                { at: 1, apply: dummy2 }
            ]
        });

        const table = new Ot.Gsub.Table();
        table.lookups = [chaining, dummy1, dummy2];

        const newTable = rectifyGsubTable(
            { glyphRef: g => (g === c ? null : g) },
            IdAxisRectifier,
            IdCoordRectifier,
            IdPointAttachmentRectifier,
            table
        );

        expect(newTable).toBeTruthy();

        const chain = newTable?.lookups[0] as Ot.Gsub.Chaining;
        expect(chain.rules[0].applications[0].apply).toBe(newTable?.lookups[1]);
    });

    test("Rectify chaining lookup when the inner lookup get cleared 2", () => {
        const a = new Ot.Glyph();
        const b = new Ot.Glyph();
        const c = new Ot.Glyph();

        const dummy1 = new Ot.Gsub.Single({ mapping: new Map([[a, c]]) });
        const dummy2 = new Ot.Gsub.Single({ mapping: new Map([[a, b]]) });

        const chaining = new Ot.Gsub.Chaining();
        chaining.rules.push({
            match: [new Set([a]), new Set([a, b])],
            inputBegins: 0,
            inputEnds: 2,
            applications: [{ at: 0, apply: dummy1 }]
        });

        const table = new Ot.Gsub.Table();
        table.lookups = [chaining, dummy1, dummy2];

        const newTable = rectifyGsubTable(
            { glyphRef: g => (g === c ? null : g) },
            IdAxisRectifier,
            IdCoordRectifier,
            IdPointAttachmentRectifier,
            table
        );

        expect(newTable).toBeTruthy();
        expect(newTable?.lookups.length).toBe(1);
        expect(newTable?.lookups[0]).toBeInstanceOf(Ot.Gsub.Single);
    });
});

function fnApplyGsubLookup(lookup: Ot.Gsub.Lookup, alg: RectifyGsubGlyphCoordAlg) {
    return alg.process(lookup);
}
