import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { DefaultTtfCfgProps } from "@ot-builder/io-bin-ttf";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { readGlyphStore } from "../general/read";

import { ReadTtfGlyphs } from "./index";

function readTtf(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { fontMetadata: {}, glyphStore: {}, ttf: DefaultTtfCfgProps };
    const md = readOtMetadata(sfnt, cfg);

    const { glyphs } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, ReadTtfGlyphs);
    return { fvar: md.fvar, glyphs };
}

test("TTF metric variation test, WidthAndVWidthVF.ttf", () => {
    const { glyphs, fvar } = readTtf("WidthAndVWidthVF.ttf");
    const gid1 = glyphs.items[1];
    const [wdth, vwid] = fvar!.axes;
    const narrow = new OtVar.Master([{ dim: wdth.dim, min: -1, peak: -1, max: 0 }]);
    const short = new OtVar.Master([{ dim: vwid.dim, min: -1, peak: -1, max: 0 }]);
    const cr = new OtVar.ValueFactory();
    expect(OtVar.Ops.equal(gid1.vertical.start, cr.make(1100, [short, -440]))).toBe(true);
    expect(OtVar.Ops.equal(gid1.vertical.end, cr.make(-150, [short, +60]))).toBe(true);
    expect(OtVar.Ops.equal(gid1.horizontal.end, cr.make(750, [narrow, -300]))).toBe(true);
});
