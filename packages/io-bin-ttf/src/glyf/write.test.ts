import { BinaryView, Frag } from "@ot-builder/bin-util";
import { DefaultFontMetadataCfgProps, readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { NopTtfWritingExtraInfoSink } from "../extra-info-sink/index";
import { rectifyGlyphOrder } from "../rectify/rectify";

import { LocaTable, LocaTableIo, LocaTag } from "./loca";
import { GlyfTableRead } from "./read";
import { GlyfTag } from "./shared";
import { GlyfTableWrite } from "./write";

function roundTripTest(file: string, padSpace: boolean) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
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

    if (padSpace) {
        for (const g of gOrd) {
            if (!g.geometry) g.geometry = new OtGlyph.ContourSet([]);
        }
    }

    const gOrd1 = gs.decideOrder();
    const loca1: LocaTable = { glyphOffsets: [] };
    const stat = new OtGlyph.Stat.Forward();
    const bufGlyf = Frag.packFrom(
        GlyfTableWrite,
        gOrd1,
        { ttf: DefaultFontMetadataCfgProps },
        loca1,
        stat,
        new NopTtfWritingExtraInfoSink()
    );
    expect(loca1.glyphOffsets.length).toBe(1 + maxp.numGlyphs);
    for (const offset of loca1.glyphOffsets) expect(offset % 4).toBe(0);
    const bufLoca = Frag.packFrom(LocaTableIo, loca1, head);

    const gs2 = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const gOrd2 = gs2.decideOrder();
    const loca2 = new BinaryView(bufLoca).next(LocaTableIo, head, maxp);
    const glyf2 = new BinaryView(bufGlyf).next(
        GlyfTableRead,
        loca2,
        gOrd2,
        new OtGlyph.CoStat.Forward()
    );
    rectifyGlyphOrder(gOrd2);

    GlyphIdentity.testStore(gs, gs2, GlyphIdentity.CompareMode.TTF);
}

test("Reading : TTF, static, SourceSerifVariable-Roman.ttf", () => {
    roundTripTest("SourceSerifVariable-Roman.ttf", false);
    roundTripTest("SourceSerifVariable-Roman.ttf", true);
});
test("Reading : TTF, static, SourceSerifVariable-Italic.ttf", () => {
    roundTripTest("SourceSerifVariable-Italic.ttf", false);
    roundTripTest("SourceSerifVariable-Italic.ttf", true);
});
test("Reading : TTF, static, SourceSerifPro-Regular.ttf", () => {
    roundTripTest("SourceSerifPro-Regular.ttf", false);
    roundTripTest("SourceSerifPro-Regular.ttf", true);
});
test("Reading : TTF, static, SourceSerifPro-It.ttf", () => {
    roundTripTest("SourceSerifPro-It.ttf", false);
    roundTripTest("SourceSerifPro-It.ttf", true);
});
test("Reading : TTF, static, Scheherazade-Regular.ttf", () => {
    roundTripTest("Scheherazade-Regular.ttf", false);
    roundTripTest("Scheherazade-Regular.ttf", true);
});
test("Reading : TTF, static, Scheherazade-Bold.ttf", () => {
    roundTripTest("Scheherazade-Bold.ttf", false);
    roundTripTest("Scheherazade-Bold.ttf", true);
});
