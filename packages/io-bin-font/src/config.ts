import * as IoBinEncoding from "@ot-builder/io-bin-encoding";
import * as IoBinExtPrivate from "@ot-builder/io-bin-ext-private";
import * as IoBinGlyphStore from "@ot-builder/io-bin-glyph-store";
import * as IoBinLayout from "@ot-builder/io-bin-layout";
import * as IoBinMetadata from "@ot-builder/io-bin-metadata";
import * as IoBinVttPrivate from "@ot-builder/io-bin-vtt-private";

export type FontIoDigitalSignatureCfg = {
    generateDummyDigitalSignature: boolean;
};
export type FontIoDigitalSignatureCfgPt = {
    generateDummyDigitalSignature?: boolean;
};

export type FontIoCfgFinal = IoBinGlyphStore.CffCfg &
    IoBinGlyphStore.TtfCfg &
    IoBinMetadata.FontMetadataCfg &
    IoBinGlyphStore.GlyphStoreCfg &
    IoBinGlyphStore.GlyphNamingCfg &
    IoBinEncoding.EncodingCfg &
    IoBinLayout.LayoutCfg &
    IoBinExtPrivate.ExtPrivateCfg &
    IoBinVttPrivate.VttPrivateCfg &
    FontIoDigitalSignatureCfg;
export type FontIoConfig = IoBinMetadata.FontMetadataCfgPt &
    IoBinGlyphStore.GlyphStoreCfgPt &
    IoBinGlyphStore.CffCfgPt &
    IoBinGlyphStore.TtfCfgPt &
    IoBinGlyphStore.GlyphNamingCfgPt &
    IoBinEncoding.EncodingCfgPt &
    IoBinLayout.LayoutCfgPt &
    IoBinExtPrivate.ExtPrivateCfgPt &
    IoBinVttPrivate.VttPrivateCfgPt &
    FontIoDigitalSignatureCfgPt;

export function createConfig(partial: FontIoConfig): FontIoCfgFinal {
    return {
        cff: { ...IoBinGlyphStore.DefaultCffCfgProps, ...partial.cff },
        ttf: { ...IoBinGlyphStore.DefaultTtfCfgProps, ...partial.ttf },
        fontMetadata: { ...IoBinMetadata.DefaultFontMetadataCfgProps, ...partial.fontMetadata },
        glyphStore: { ...IoBinGlyphStore.DefaultGlyphStoreCfgProps, ...partial.glyphStore },
        glyphNaming: { ...IoBinGlyphStore.DefaultGlyphNamingCfgProps, ...partial.glyphNaming },
        encoding: { ...IoBinEncoding.DefaultEncodingCfgProps, ...partial.encoding },
        layout: { ...IoBinLayout.DefaultLayoutProps, ...partial.layout },
        extPrivate: { ...IoBinExtPrivate.DefaultExtPrivateCfgProps, ...partial.extPrivate },
        vttPrivate: { ...IoBinVttPrivate.DefaultVttPrivateCfgProps, ...partial.vttPrivate },
        generateDummyDigitalSignature: !!partial.generateDummyDigitalSignature
    };
}

export { LookupWriteTrick } from "@ot-builder/io-bin-layout";
