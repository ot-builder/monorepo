import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { DefaultTtfCfgProps } from "@ot-builder/io-bin-ttf";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { readGlyphStore } from "../general/read";

import { ReadTtfGlyphs } from "./index";

function readTtf(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ fontMetadata: {}, glyphStore: {}, ttf: DefaultTtfCfgProps });
    const md = readOtMetadata(sfnt, cfg);

    const { glyphs } = readGlyphStore(sfnt, cfg, md, OtListGlyphStoreFactory, ReadTtfGlyphs);
    return { fvar: md.fvar, glyphs };
}

test("TTF metric variation test, WidthAndVWidthVF.ttf", () => {
    const { glyphs, fvar } = readTtf("WidthAndVWidthVF.ttf");
    const gid1 = glyphs.items[1];
    const [wdth, vwid] = fvar!.axes;
    const narrow = OtVar.Master.Create({ axis: wdth, min: -1, peak: -1, max: 0 });
    const short = OtVar.Master.Create({ axis: vwid, min: -1, peak: -1, max: 0 });
    const cr = OtVar.Ops.Creator();
    expect(OtVar.Ops.equal(gid1.vertical.start, cr.make(1100, [short, -440]))).toBe(true);
    expect(OtVar.Ops.equal(gid1.vertical.end, cr.make(-150, [short, +60]))).toBe(true);
    expect(OtVar.Ops.equal(gid1.horizontal.end, cr.make(750, [narrow, -300]))).toBe(true);
});
