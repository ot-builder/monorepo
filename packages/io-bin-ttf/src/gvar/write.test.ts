import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { DefaultTtfCfgProps, TtfCfgProps } from "../cfg";
import { LocaTable, LocaTableIo, LocaTag } from "../glyf/loca";
import { GlyfTableRead } from "../glyf/read";
import { GlyfTag } from "../glyf/shared";
import { GlyfTableWrite } from "../glyf/write";
import { rectifyGlyphOrder } from "../rectify/rectify";

import { GvarTableRead } from "./read";
import { GvarTag } from "./shared";
import { GvarTableWrite } from "./write";

function roundTripTest(file: string, override: Partial<TtfCfgProps>, identityTolerance = 1) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = {
        ttf: { ...DefaultTtfCfgProps, ...(override || {}) },
        fontMetadata: {}
    };
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const designSpace = fvar ? fvar.getDesignSpace() : null;
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const loca = new BinaryView(sfnt.tables.get(LocaTag)!).next(LocaTableIo, head, maxp);
    const glyf = new BinaryView(sfnt.tables.get(GlyfTag)!).next(
        GlyfTableRead,
        loca,
        gOrd,
        new OtGlyph.CoStat.Forward()
    );
    if (designSpace) {
        const gvar = new BinaryView(sfnt.tables.get(GvarTag)!).next(
            GvarTableRead,
            gOrd,
            cfg,
            {},
            designSpace
        );
    }
    rectifyGlyphOrder(gOrd);

    const gOrd1 = gs.decideOrder();
    const loca1: LocaTable = { glyphOffsets: [] };
    const stat = new OtGlyph.Stat.Forward();
    let gvarBuf: null | Buffer = null;
    if (designSpace) gvarBuf = Frag.packFrom(GvarTableWrite, gOrd1, cfg, designSpace);

    const bufGlyf = Frag.packFrom(GlyfTableWrite, gOrd1, loca1, stat);
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
    if (designSpace && gvarBuf) {
        const gvar2 = new BinaryView(gvarBuf).next(GvarTableRead, gOrd2, cfg, {}, designSpace);
    }
    rectifyGlyphOrder(gOrd2);

    GlyphIdentity.testStore(gs, gs2, GlyphIdentity.CompareMode.TTF, identityTolerance);
}

const DontOptimize: Partial<TtfCfgProps> = { gvarOptimizeTolerance: 0 };
const Optimize: Partial<TtfCfgProps> = {};

test("Reading : TTF, static + variable, SourceSerifVariable-Roman.ttf", () => {
    roundTripTest("SourceSerifVariable-Roman.ttf", DontOptimize);
    roundTripTest("SourceSerifVariable-Roman.ttf", Optimize);
});
test("Reading : TTF, static + variable, SourceSerifVariable-Italic.ttf", () => {
    roundTripTest("SourceSerifVariable-Italic.ttf", DontOptimize);
    roundTripTest("SourceSerifVariable-Italic.ttf", Optimize);
});
test("Reading : TTF, static + variable, SourceSerifPro-Regular.ttf", () => {
    roundTripTest("SourceSerifPro-Regular.ttf", DontOptimize);
    roundTripTest("SourceSerifPro-Regular.ttf", Optimize);
});
test("Reading : TTF, static + variable, SourceSerifPro-It.ttf", () => {
    roundTripTest("SourceSerifPro-It.ttf", DontOptimize);
    roundTripTest("SourceSerifPro-It.ttf", Optimize);
});
test("Reading : TTF, static + variable, Scheherazade-Regular.ttf", () => {
    roundTripTest("Scheherazade-Regular.ttf", DontOptimize);
    roundTripTest("Scheherazade-Regular.ttf", Optimize);
});
test("Reading : TTF, static + variable, Scheherazade-Bold.ttf", () => {
    roundTripTest("Scheherazade-Bold.ttf", DontOptimize);
    roundTripTest("Scheherazade-Bold.ttf", Optimize);
});
test("Reading : TTF, static + variable, AdobeVFPrototype.ttf", () => {
    roundTripTest("AdobeVFPrototype.ttf", DontOptimize);
    roundTripTest("AdobeVFPrototype.ttf", Optimize);
});
test("Reading : TTF, static + variable, TestCVARGVAROne.ttf", () => {
    roundTripTest("TestCVARGVAROne.ttf", DontOptimize, 2); // Rounding error may happen
    roundTripTest("TestCVARGVAROne.ttf", Optimize);
});
test("Reading : TTF, static + variable, TestCVARGVARTwo.ttf", () => {
    roundTripTest("TestCVARGVARTwo.ttf", DontOptimize, 2); // Rounding error may happen
    roundTripTest("TestCVARGVARTwo.ttf", Optimize);
});
