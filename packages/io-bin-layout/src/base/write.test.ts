import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Base } from "@ot-builder/ot-layout";
import { BaseIdentity, EmptyCtx, TestFont } from "@ot-builder/test-util";

import { BaseTableIo } from "./index";

describe("BASE read-write roundtrip", () => {
    function testBase(file: string) {
        const bufFont = TestFont.get(file);
        const sfnt = readSfntOtf(bufFont);
        const cfg = { fontMetadata: {}, glyphStore: {} };
        const md = readOtMetadata(sfnt, cfg);
        const designSpace = md.fvar ? md.fvar.getDesignSpace() : null;

        const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
        const base = new BinaryView(sfnt.tables.get(Base.Tag)!).next(
            BaseTableIo,
            gOrd,
            designSpace
        );
        const baseBuf1 = Frag.packFrom(BaseTableIo, base, gOrd, designSpace);
        const base2 = new BinaryView(baseBuf1).next(BaseTableIo, gOrd, designSpace);
        BaseIdentity.test(EmptyCtx.create(), base2, base);
    }

    test("Source Serif Variable", () => {
        testBase("SourceSerifVariable-Roman.otf");
    });
});
