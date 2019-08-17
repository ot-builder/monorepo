import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { rectifyGlyphOrder } from "../rectify/rectify";

import { CompositeGlyph, GlyphClassifier, SimpleGlyph } from "./classifier";
import { LocaTableIo, LocaTag } from "./loca";
import { GlyfTableRead } from "./read";
import { GlyfTag } from "./shared";

test("TTF glyph classifier", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ fontMetadata: {} });

    const { head, maxp } = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const loca = new BinaryView(sfnt.tables.get(LocaTag)!).next(LocaTableIo, head, maxp);
    new BinaryView(sfnt.tables.get(GlyfTag)!).next(
        GlyfTableRead,
        loca,
        gOrd,
        new OtGlyph.CoStat.Forward()
    );
    rectifyGlyphOrder(gOrd);

    const classifier = new GlyphClassifier(gOrd);
    const g0 = classifier.classify(gOrd.at(0));
    expect(g0).toBeInstanceOf(SimpleGlyph);
    expect(g0.getStatData()).toEqual({
        eigenContours: 4,
        eigenPoints: 16,
        extent: { xMin: 80, xMax: 560, yMin: 0, yMax: 670 },
        depth: 0,
        eigenReferences: 0,
        totalContours: 4,
        totalPoints: 16
    });

    const g300 = classifier.classify(gOrd.at(300));
    expect(g300).toBeInstanceOf(CompositeGlyph);
    expect(g300.getStatData()).toEqual({
        eigenContours: 0,
        eigenPoints: 0,
        extent: { xMin: 30, xMax: 265, yMin: 0, yMax: 745 },
        depth: 1,
        eigenReferences: 2,
        totalContours: 3,
        totalPoints: 39
    });
});
