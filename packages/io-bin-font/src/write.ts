import { writeEncoding } from "@ot-builder/io-bin-encoding";
import { writeExtPrivate } from "@ot-builder/io-bin-ext-private";
import { WriteCffGlyphs, writeGlyphStore, WriteTtfGlyphs } from "@ot-builder/io-bin-glyph-store";
import { writeOtl } from "@ot-builder/io-bin-layout";
import { writeOtMetadata } from "@ot-builder/io-bin-metadata";
import { writeNames } from "@ot-builder/io-bin-name";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import * as Ot from "@ot-builder/ot";
import { OtEncoding } from "@ot-builder/ot-encoding";
import { OtExtPrivate } from "@ot-builder/ot-ext-private";
import { CffCoGlyphs, TtfCoGlyphs } from "@ot-builder/ot-glyphs";
import { OtFontLayoutData } from "@ot-builder/ot-layout";
import { OtFontIoMetadata } from "@ot-builder/ot-metadata";
import { OtNameData } from "@ot-builder/ot-name";
import { Sfnt } from "@ot-builder/ot-sfnt";
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
function ExtPrivate<GS extends Ot.GlyphStore>(font: Ot.Font<GS>): OtExtPrivate {
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
    partialConfig: FontIoConfig = {}
): Sfnt {
    const sfnt = new Sfnt(Ot.Font.isCff(font) ? 0x4f54544f : 0x00010000);
    const sink = new SfntIoTableSink(sfnt);

    const fullCfg = createConfig(partialConfig);
    const gOrd = font.glyphs.decideOrder();

    // Alias fonts
    const md = MD(font, new WritePostNaming(gOrd));
    writeOtl(sink, OTL(font), gOrd, md);
    writeEncoding(sink, fullCfg, Encoding(font), gOrd, md);
    if (Ot.Font.isCff(font)) {
        writeGlyphStore(sink, fullCfg, md, CffCoGlyphs(font), gOrd, WriteCffGlyphs);
    } else {
        writeGlyphStore(sink, fullCfg, md, TtfCoGlyphs(font), gOrd, WriteTtfGlyphs);
    }
    writeNames(sink, Names(font));
    writeOtMetadata(sink, fullCfg, md);
    writeExtPrivate(sink, fullCfg, ExtPrivate(font), gOrd, md);

    if (fullCfg.generateDummyDigitalSignature) {
        sink.add("DSIG", Buffer.from([0, 0, 0, 1, 0, 0, 0, 0]));
    }

    return sfnt;
}
