import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { BimapCtx, CmapIdentity, Disorder, TestFont } from "@ot-builder/test-util";

import { ReadCmap } from "./read";
import { WriteCmap } from "./write";

function cmapRoundtrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { fontMetadata: {}, glyphStore: {} };
    const md = readOtMetadata(sfnt, cfg);

    const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
    const cmap = new BinaryView(sfnt.tables.get(Cmap.Tag)!).next(ReadCmap, gOrd);
    if (cmap.unicode) {
        cmap.unicode = new Cmap.EncodingMap(Disorder.shuffleArray([...cmap.unicode.entries()]));
    }
    if (cmap.vs) {
        cmap.vs = new Cmap.VsEncodingMap(Disorder.shuffleArray([...cmap.vs.entries()]));
    }

    const bufCmap = Frag.pack(Frag.from(WriteCmap, cmap, gOrd));
    const cmap1 = new BinaryView(bufCmap).next(ReadCmap, gOrd);

    CmapIdentity.test(BimapCtx.from(gOrd, gOrd), cmap, cmap1);
}

test("CMAP roundtrip -- Source Serif Variable", () => {
    cmapRoundtrip("SourceSerifVariable-Roman.otf");
});
test("CMAP roundtrip -- KRName (UVS)", () => {
    cmapRoundtrip("KRName-Regular.otf");
});
