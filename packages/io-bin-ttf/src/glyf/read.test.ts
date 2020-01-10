import { BinaryView } from "@ot-builder/bin-util";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { GlyphToInitialUtil, TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { rectifyGlyphOrder } from "../rectify/rectify";

import { LocaTableIo, LocaTag } from "./loca";
import { GlyfTableRead } from "./read";
import { GlyfTag } from "./shared";

test("Reading : TTF, static", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { fontMetadata: {} };
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
                OtGlyph.Point.create(80, 0, 0),
                OtGlyph.Point.create(500, 670, 0),
                OtGlyph.Point.create(560, 670, 0),
                OtGlyph.Point.create(140, 0, 0)
            ],
            [
                OtGlyph.Point.create(560, 0, 0),
                OtGlyph.Point.create(500, 0, 0),
                OtGlyph.Point.create(80, 670, 0),
                OtGlyph.Point.create(140, 670, 0)
            ],
            [
                OtGlyph.Point.create(140, 50, 0),
                OtGlyph.Point.create(500, 50, 0),
                OtGlyph.Point.create(500, 620, 0),
                OtGlyph.Point.create(140, 620, 0)
            ],
            [
                OtGlyph.Point.create(80, 0, 0),
                OtGlyph.Point.create(80, 670, 0),
                OtGlyph.Point.create(560, 670, 0),
                OtGlyph.Point.create(560, 0, 0)
            ]
        ]);
    }
    {
        const g300 = gOrd.at(300);
        expect(g300.geometry).toBeTruthy();

        expect(g300.geometry!.apply(GlyphToInitialUtil.GeometryToInitial).type).toBe(
            GlyphToInitialUtil.InitialGeometryType.GeometryList
        );

        const geom = g300.geometry as OtGlyph.GeometryList;
        expect(geom.items.length).toBe(2);

        const base = geom.items[0] as OtGlyph.TtReference;
        const diacritic = geom.items[1] as OtGlyph.TtReference;

        expect(base.to).toBe(gOrd.at(302));
        expect(diacritic.to).toBe(gOrd.at(806));
        expect(OtVar.Ops.equal(diacritic.transform.dx, 0x94)).toBe(true);
        expect(OtVar.Ops.equal(diacritic.transform.dy, 0)).toBe(true);
    }
});
