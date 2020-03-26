import { BinaryView } from "@ot-builder/bin-util";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { TestFont } from "@ot-builder/test-util";

import { ReadCmap } from "./read";

function cmapRead(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { fontMetadata: {}, glyphStore: {} };
    const md = readOtMetadata(sfnt, cfg);

    const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
    const cmap = new BinaryView(sfnt.tables.get(Cmap.Tag)!).next(ReadCmap, gOrd);

    return { gOrd, cmap };
}

test("CMAP read -- Source Serif Variable", () => {
    const { cmap, gOrd } = cmapRead("SourceSerifVariable-Roman.otf");
    expect(cmap.unicode.get("A".codePointAt(0)!)).toBe(gOrd.at(2));
    expect(cmap.unicode.get(0xfb04)).toBe(gOrd.at(420));
    expect(cmap.unicode.get(0x1f12f)).toBe(gOrd.at(1100));
    expect(cmap.unicode.get(0x1f16b)).toBe(gOrd.at(1102));
});
test("CMAP read -- KRName", () => {
    const { cmap, gOrd } = cmapRead("KRName-Regular.otf");
    expect(cmap.vs.get(0x537f, 0xe0108)).toBe(gOrd.at(2));
    expect(cmap.vs.get(0x537f, 0xe0109)).toBe(gOrd.at(3));
    expect(cmap.vs.get(0x9f9c, 0xe0107)).toBe(gOrd.at(36));
    expect(cmap.vs.get(0x9f9c, 0xe0108)).toBe(gOrd.at(37));
});
