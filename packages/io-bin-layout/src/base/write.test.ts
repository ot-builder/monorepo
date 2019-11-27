import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { ImpLib } from "@ot-builder/common-impl";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Base } from "@ot-builder/ft-layout";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { BaseIdentity, EmptyCtx, TestFont } from "@ot-builder/test-util";

import { BaseTableIo } from "./index";

describe("BASE read-write roundtrip", () => {
    function testBase(file: string) {
        const bufFont = TestFont.get(file);
        const sfnt = new BinaryView(bufFont).next(SfntOtf);
        const cfg = Config.create({ fontMetadata: {}, glyphStore: {} });
        const md = readOtMetadata(sfnt, cfg);
        const axes = md.fvar ? ImpLib.Order.fromList("Axes", md.fvar.axes) : null;

        const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
        const base = new BinaryView(sfnt.tables.get(Base.Tag)!).next(BaseTableIo, gOrd, axes);
        const baseBuf1 = Frag.packFrom(BaseTableIo, base, gOrd, axes);
        const base2 = new BinaryView(baseBuf1).next(BaseTableIo, gOrd, axes);
        BaseIdentity.test(EmptyCtx.create(), base2, base);
    }

    test("Source Serif Variable", () => {
        testBase("SourceSerifVariable-Roman.otf");
    });
});
