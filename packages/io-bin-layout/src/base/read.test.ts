import { BinaryView } from "@ot-builder/bin-util";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Base } from "@ot-builder/ot-layout";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { BaseTableIo } from "./index";

describe("BASE read", () => {
    function readBASE(file: string) {
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
        return { base };
    }

    test("Source Serif Variable", () => {
        const { base } = readBASE("SourceSerifVariable-Roman.otf");
        expect(base.horizontal).toBeTruthy();
        const baseH = base.horizontal!;
        expect(baseH.baselineTags).toEqual(["ideo", "romn"]);
        const baseHDflt = baseH.scripts.get(`DFLT`)!.baseValues!;
        expect(baseHDflt.defaultBaselineIndex).toBe(1);
        expect(OtVar.Ops.equal(1, baseHDflt.baseValues.get("romn")!.at)).toBe(true);
    });
});
