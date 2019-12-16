import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { BimapCtx, CmapIdentity, Disorder, TestFont } from "@ot-builder/test-util";

import { ReadCmap } from "./read";
import { WriteCmap } from "./write";

function cmapRoundtrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { fontMetadata: {}, glyphStore: {} };
    const md = readOtMetadata(sfnt, cfg);

    const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
    const cmap = new BinaryView(sfnt.tables.get(Cmap.Tag)!).next(ReadCmap, gOrd);
    if (cmap.unicode) {
        cmap.unicode = Cmap.createMapping(Disorder.shuffleArray([...cmap.unicode.entries()]));
    }
    if (cmap.vs) {
        cmap.vs = Cmap.createVsMapping(Disorder.shuffleArray([...cmap.vs.entries()]));
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
