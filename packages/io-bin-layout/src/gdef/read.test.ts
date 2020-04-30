import { BinaryView } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { readGlyphStore, SkipReadGlyphs } from "@ot-builder/io-bin-glyph-store";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { TestFont } from "@ot-builder/test-util";

import { GdefTableIo } from "./index";

describe("GDEF read", () => {
    function readGdef(file: string) {
        const bufFont = TestFont.get(file);
        const sfnt = readSfntOtf(bufFont);
        const cfg = { fontMetadata: {}, glyphStore: {} };
        const md = readOtMetadata(sfnt, cfg);
        const designSpace = md.fvar ? md.fvar.getDesignSpace() : null;

        const { gOrd } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, SkipReadGlyphs);
        const gdefDat = new BinaryView(sfnt.tables.get(Gdef.Tag)!).next(
            GdefTableIo,
            gOrd,
            designSpace
        );

        return { gOrd, gdef: gdefDat.gdef, ivs: gdefDat.ivs };
    }

    test("Source Serif Variable", () => {
        const { gdef, gOrd } = readGdef("SourceSerifVariable-Roman.otf");
        expect(gdef.glyphClassDef).toBeTruthy();
        expect(gdef.markAttachClassDef).toBeTruthy();
        expect(gdef.glyphClassDef!.get(gOrd.at(2))).toBe(1);
        expect(gdef.glyphClassDef!.get(gOrd.at(833))).toBe(3);
        expect(gdef.markAttachClassDef!.get(gOrd.at(777))).toBe(1);
        expect(gdef.markAttachClassDef!.get(gOrd.at(1097))).toBe(2);
    });

    test("Scheherazade Regular", () => {
        const { gdef, gOrd } = readGdef("Scheherazade-Regular.ttf");
        expect(gdef.markGlyphSets).toBeTruthy();
        expect(gdef.markGlyphSets!.length).toEqual(4);
        expect(Array.from(gdef.markGlyphSets![0])).toEqual([gOrd.at(1087)]);
        expect(Array.from(gdef.markGlyphSets![1])).toEqual(
            [1075, 1076, 1077, 1078, 1087].map(gid => gOrd.at(gid))
        );
    });

    test("Noto Sans Regular", () => {
        const { gdef, gOrd } = readGdef("NotoSans-Regular.ttf");
        expect(gdef.ligCarets).toBeTruthy();
        const glyph = gOrd.at(1969); // f_f_i
        expect(gdef.ligCarets!.get(glyph)).toBeTruthy();
        const carets = gdef.ligCarets!.get(glyph)!;
        expect(carets.length).toEqual(2);
        expect(carets[0].x).toBe(315);
        expect(carets[1].x).toBe(631);
    });
});
