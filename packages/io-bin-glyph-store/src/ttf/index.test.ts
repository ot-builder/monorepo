import { BinaryView } from "@ot-builder/bin-util";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntIoTableSink, SfntOtf } from "@ot-builder/io-bin-sfnt";
import { DefaultTtfCfgProps } from "@ot-builder/io-bin-ttf";
import { CvtIdentity, EmptyCtx, GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { readGlyphStore } from "../general/read";
import { writeGlyphStore } from "../general/write";

import { ReadTtfGlyphs, WriteTtfGlyphs } from "./index";

function ttfGsRoundTrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { fontMetadata: {}, glyphStore: {}, ttf: DefaultTtfCfgProps };
    const md = readOtMetadata(sfnt, cfg);

    const timeStart = new Date();
    const { glyphs, coGlyphs: coGlyf } = readGlyphStore(
        sfnt,
        cfg,
        md,
        OtListGlyphStoreFactory,
        ReadTtfGlyphs
    );
    const timeRead = new Date();

    const gOrd = glyphs.decideOrder();
    const sink = new SfntIoTableSink(sfnt);
    writeGlyphStore(sink, cfg, md, coGlyf, gOrd, WriteTtfGlyphs);
    const timeWritten = new Date();

    const { glyphs: glyphs1, coGlyphs: coGlyf1 } = readGlyphStore(
        sfnt,
        cfg,
        md,
        OtListGlyphStoreFactory,
        ReadTtfGlyphs
    );

    GlyphIdentity.testStore(glyphs, glyphs1, GlyphIdentity.CompareMode.TTF);
    CvtIdentity.test(EmptyCtx.create(), coGlyf.cvt, coGlyf1.cvt);
    expect(coGlyf.fpgm).toEqual(coGlyf1.fpgm);
    expect(coGlyf.prep).toEqual(coGlyf1.prep);

    console.log(
        `Test file ${file}\n` +
            `TTF read time ${timeRead.valueOf() - timeStart.valueOf()}\n` +
            `TTF write time ${timeWritten.valueOf() - timeRead.valueOf()}`
    );
}

test("TTF glyph store round-trip test, static + variable, SourceSerifVariable-Roman.ttf", () => {
    ttfGsRoundTrip("SourceSerifVariable-Roman.ttf");
});
test("TTF glyph store round-trip test, static + variable, SourceSerifVariable-Italic.ttf", () => {
    ttfGsRoundTrip("SourceSerifVariable-Italic.ttf");
});
test("TTF glyph store round-trip test, static + variable, SourceSerifPro-Regular.ttf", () => {
    ttfGsRoundTrip("SourceSerifPro-Regular.ttf");
});
test("TTF glyph store round-trip test, static + variable, SourceSerifPro-It.ttf", () => {
    ttfGsRoundTrip("SourceSerifPro-It.ttf");
});
test("TTF glyph store round-trip test, static + variable, Scheherazade-Regular.ttf", () => {
    ttfGsRoundTrip("Scheherazade-Regular.ttf");
});
test("TTF glyph store round-trip test, static + variable, Scheherazade-Bold.ttf", () => {
    ttfGsRoundTrip("Scheherazade-Bold.ttf");
});
test("TTF glyph store round-trip test, static + variable, AdobeVFPrototype.ttf", () => {
    ttfGsRoundTrip("AdobeVFPrototype.ttf");
});
test("TTF glyph store round-trip test, static + variable, TestCVARGVAROne.ttf", () => {
    ttfGsRoundTrip("TestCVARGVAROne.ttf");
});
test("TTF glyph store round-trip test, static + variable, TestCVARGVARTwo.ttf", () => {
    ttfGsRoundTrip("TestCVARGVARTwo.ttf");
});
test("TTF glyph store round-trip test, static + variable, WidthAndVWidthVF.ttf", () => {
    ttfGsRoundTrip("WidthAndVWidthVF.ttf");
});
