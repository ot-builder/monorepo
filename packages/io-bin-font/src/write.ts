import * as Ot from "@ot-builder/font";
import { OtEncoding } from "@ot-builder/ft-encoding";
import { CffCoGlyphs, TtfCoGlyphs } from "@ot-builder/ft-glyphs";
import { OtFontLayoutData } from "@ot-builder/ft-layout";
import { OtFontIoMetadata } from "@ot-builder/ft-metadata";
import { OtNameData } from "@ot-builder/ft-name";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { writeEncoding } from "@ot-builder/io-bin-encoding";
import { WriteCffGlyphs, writeGlyphStore, WriteTtfGlyphs } from "@ot-builder/io-bin-glyph-store";
import { writeOtl } from "@ot-builder/io-bin-layout";
import { writeOtMetadata } from "@ot-builder/io-bin-metadata";
import { writeNames } from "@ot-builder/io-bin-name";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { createConfig, FontIoConfig } from "./config";

// Lenses here are somehow unnecessary, but it will prevent random errors in the write code
function MD<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    naming: WritePostNaming
): OtFontIoMetadata {
    return { ...font, postGlyphNaming: naming };
}
function Names<GS extends Ot.GlyphStore>(font: Ot.Font<GS>): OtNameData {
    return font;
}
function CffCoGlyphs<GS extends Ot.GlyphStore>(font: Ot.Font.Cff<GS>): CffCoGlyphs {
    return font;
}
function TtfCoGlyphs<GS extends Ot.GlyphStore>(font: Ot.Font.Ttf<GS>): TtfCoGlyphs {
    return font;
}
function Encoding<GS extends Ot.GlyphStore>(font: Ot.Font<GS>): OtEncoding {
    return font;
}
function OTL<GS extends Ot.GlyphStore>(font: Ot.Font<GS>): OtFontLayoutData {
    return font;
}

class WritePostNaming implements Data.Naming.Source<number> {
    constructor(private readonly gOrd: Data.Order<Ot.Glyph>) {}
    public getName(gid: number) {
        return this.gOrd.at(gid).name;
    }
}

export function writeFont<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    config: FontIoConfig = {}
): Sfnt {
    const sfnt = new Sfnt(Ot.Font.isCff(font) ? 0x4f54544f : 0x00010000);
    const sink = new SfntIoTableSink(sfnt);

    const fullCfg = createConfig(config);
    const gOrd1 = font.glyphs.decideOrder();

    // Alias fonts
    const md = MD(font, new WritePostNaming(gOrd1));
    writeOtl(sink, OTL(font), gOrd1, md);
    writeEncoding(sink, fullCfg, Encoding(font), gOrd1, md);
    if (Ot.Font.isCff(font)) {
        writeGlyphStore(sink, fullCfg, md, CffCoGlyphs(font), gOrd1, WriteCffGlyphs);
    } else {
        writeGlyphStore(sink, fullCfg, md, TtfCoGlyphs(font), gOrd1, WriteTtfGlyphs);
    }
    writeNames(sink, Names(font));
    writeOtMetadata(sink, fullCfg, md);

    return sfnt;
}
