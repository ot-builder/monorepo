import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { setEqual } from "@ot-builder/test-util";

import { TestOtlLoop } from "./-shared-test-loop.test";

test("OTL Integrated Test Loop - ignore glyph set -- All marks", () => {
    for (const { otl } of TestOtlLoop("Scheherazade-Regular.ttf")) {
        const { gpos, gdef } = otl;
        if (!gpos) fail("GPOS not present");
        if (!gdef) fail("GDEF not present");

        // Collect all mark glyphs
        const marks = new Set<OtGlyph>();
        for (const [g, c] of gdef.glyphClassDef!) {
            if (c === Gdef.GlyphClass.Mark) marks.add(g);
        }

        const lookup = gpos.lookups[0];
        expect(setEqual(lookup.ignoreGlyphs!, marks)).toBeTruthy();
    }
});

test("OTL Integrated Test Loop - ignore glyph set -- Mark set", () => {
    for (const { otl } of TestOtlLoop("Scheherazade-Regular.ttf")) {
        const { gpos, gdef } = otl;
        if (!gpos) fail("GPOS not present");
        if (!gdef) fail("GDEF not present");

        const markSet = gdef.markGlyphSets![2];
        const lookup = gpos.lookups[3];

        expect(setEqual(lookup.ignoreGlyphs!, markSet)).toBeTruthy();
    }
});

test("OTL Integrated Test Loop - ignore glyph set -- mark attachment type", () => {
    for (const { otl } of TestOtlLoop("SourceCodeVariable-Roman.ttf")) {
        const { gpos, gdef } = otl;
        if (!gpos) fail("GPOS not present");
        if (!gdef) fail("GDEF not present");

        // Collect mark classes that is NOT 1
        const markNotClass1 = new Set<OtGlyph>();
        for (const [g, c] of gdef.glyphClassDef!) {
            if (c !== Gdef.GlyphClass.Mark) continue;
            const mk = gdef.markAttachClassDef!.get(g) || 0;
            if (mk !== 1) markNotClass1.add(g);
        }

        const lookup = gpos.lookups[13];
        expect(setEqual(lookup.ignoreGlyphs!, markNotClass1)).toBeTruthy();
    }
});
