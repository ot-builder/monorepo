import { DefaultCffCfgProps } from "@ot-builder/io-bin-cff";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf, SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { readGlyphStore } from "../general/read";
import { writeGlyphStore } from "../general/write";

import { ReadCffGlyphs, WriteCffGlyphs } from "./index";

function cffGsRoundTrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { fontMetadata: {}, glyphStore: {}, cff: DefaultCffCfgProps };
    const md = readOtMetadata(sfnt, cfg);

    const timeStart = new Date();
    const { glyphs, coGlyphs: cff } = readGlyphStore(
        sfnt,
        cfg,
        md,
        OtListGlyphStoreFactory,
        ReadCffGlyphs
    );
    const timeRead = new Date();

    if (cff.cffGlyphNaming) {
        for (const g of glyphs.items) g.name = cff.cffGlyphNaming.getName(g) || `?`;
    }

    const gOrd = glyphs.decideOrder();
    const sink = new SfntIoTableSink(sfnt);
    writeGlyphStore(sink, cfg, md, cff, gOrd, WriteCffGlyphs);
    const timeWritten = new Date();

    const { glyphs: glyphs1, coGlyphs: cff1 } = readGlyphStore(
        sfnt,
        cfg,
        md,
        OtListGlyphStoreFactory,
        ReadCffGlyphs
    );
    if (cff1.cffGlyphNaming) {
        for (const g of glyphs1.items) g.name = cff1.cffGlyphNaming.getName(g) || `?`;
    }

    GlyphIdentity.testStore(
        glyphs,
        glyphs1,
        GlyphIdentity.CompareMode.RemoveCycle |
            GlyphIdentity.CompareMode.CompareMetric |
            GlyphIdentity.CompareMode.CompareName
    );

    console.log(
        `Test file ${file}\n` +
            `CFF read time ${timeRead.valueOf() - timeStart.valueOf()}\n` +
            `CFF write time ${timeWritten.valueOf() - timeRead.valueOf()}`
    );
}

test("CFF glyph store roundtrip, AdobeVFPrototype.otf", () => {
    cffGsRoundTrip("AdobeVFPrototype.otf");
});
test("CFF glyph store roundtrip, Source Serif Variable Roman", () => {
    cffGsRoundTrip("SourceSerifVariable-Roman.otf");
});
test("CFF glyph store roundtrip, Source Serif Variable Italic", () => {
    cffGsRoundTrip("SourceSerifVariable-Italic.otf");
});
test("CFF glyph store roundtrip, Source Serif Pro Regular", () => {
    cffGsRoundTrip("SourceSerifPro-Regular.otf");
});
test("CFF glyph store roundtrip, Inter Regular", () => {
    cffGsRoundTrip("Inter-Regular.otf");
});
test("CFF glyph store roundtrip, KRName (CID)", () => {
    cffGsRoundTrip("KRName-Regular.otf");
});
test("CFF glyph store roundtrip, WidthAndVWidthVF", () => {
    cffGsRoundTrip("WidthAndVWidthVF.otf");
});
