import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { rectifyGlyphOrder } from "../rectify/rectify";

import { LocaTableIo, LocaTag } from "./loca";
import { GlyfTableRead } from "./read";
import { GlyfTag } from "./shared";

test("Reading : TTF, static", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ fontMetadata: {} });
    const { head, maxp } = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const loca = new BinaryView(sfnt.tables.get(LocaTag)!).next(LocaTableIo, head, maxp);
    const glyf = new BinaryView(sfnt.tables.get(GlyfTag)!).next(
        GlyfTableRead,
        loca,
        gOrd,
        new OtGlyph.CoStat.Forward()
    );
    rectifyGlyphOrder(gOrd);
    {
        const notDef = gOrd.at(0);
        const outlines = notDef.geometry as OtGlyph.ContourSet;
        expect(outlines).toBeTruthy();
        expect(outlines.contours).toEqual([
            [
                new OtGlyph.Point(80, 0, 0),
                new OtGlyph.Point(500, 670, 0),
                new OtGlyph.Point(560, 670, 0),
                new OtGlyph.Point(140, 0, 0)
            ],
            [
                new OtGlyph.Point(560, 0, 0),
                new OtGlyph.Point(500, 0, 0),
                new OtGlyph.Point(80, 670, 0),
                new OtGlyph.Point(140, 670, 0)
            ],
            [
                new OtGlyph.Point(140, 50, 0),
                new OtGlyph.Point(500, 50, 0),
                new OtGlyph.Point(500, 620, 0),
                new OtGlyph.Point(140, 620, 0)
            ],
            [
                new OtGlyph.Point(80, 0, 0),
                new OtGlyph.Point(80, 670, 0),
                new OtGlyph.Point(560, 670, 0),
                new OtGlyph.Point(560, 0, 0)
            ]
        ]);
    }
    {
        const g300 = gOrd.at(300);
        expect(g300.geometry).toBeTruthy();
        expect(g300.geometry).toBeInstanceOf(OtGlyph.TtReferenceList);

        const geom = g300.geometry as OtGlyph.TtReferenceList;
        expect(geom.references.length).toBe(2);

        const base = geom.references[0];
        const diacritic = geom.references[1];

        expect(base.to).toBe(gOrd.at(302));
        expect(diacritic.to).toBe(gOrd.at(806));
        expect(OtVar.Ops.equal(diacritic.transform.dx, 0x94)).toBe(true);
        expect(OtVar.Ops.equal(diacritic.transform.dy, 0)).toBe(true);
    }
});
