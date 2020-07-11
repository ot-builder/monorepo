import * as IoBinEncoding from "@ot-builder/io-bin-encoding";
import * as IoBinExtPrivate from "@ot-builder/io-bin-ext-private";
import * as IoBinGlyphStore from "@ot-builder/io-bin-glyph-store";
import * as IoBinMetadata from "@ot-builder/io-bin-metadata";

export type FontIoCfgFinal = IoBinGlyphStore.CffCfg &
    IoBinGlyphStore.TtfCfg &
    IoBinMetadata.FontMetadataCfg &
    IoBinGlyphStore.GlyphStoreCfg &
    IoBinEncoding.EncodingCfg &
    IoBinGlyphStore.GlyphNamingCfg &
    IoBinExtPrivate.ExtPrivateCfg;
export type FontIoConfig = IoBinMetadata.FontMetadataCfgPt &
    IoBinGlyphStore.GlyphStoreCfgPt &
    IoBinGlyphStore.CffCfgPt &
    IoBinGlyphStore.TtfCfgPt &
    IoBinEncoding.EncodingCfgPt &
    IoBinGlyphStore.GlyphNamingCfgPt &
    IoBinExtPrivate.ExtPrivateCfgPt;

export function createConfig(partial: FontIoConfig): FontIoCfgFinal {
    return {
        cff: { ...IoBinGlyphStore.DefaultCffCfgProps, ...partial.cff },
        ttf: { ...IoBinGlyphStore.DefaultTtfCfgProps, ...partial.ttf },
        fontMetadata: { ...IoBinMetadata.DefaultFontMetadataCfgProps, ...partial.fontMetadata },
        glyphStore: { ...IoBinGlyphStore.DefaultGlyphStoreCfgProps, ...partial.glyphStore },
        glyphNaming: { ...IoBinGlyphStore.DefaultGlyphNamingCfgProps, ...partial.glyphNaming },
        encoding: { ...IoBinEncoding.DefaultEncodingCfgProps, ...partial.encoding },
        extPrivate: { ...IoBinExtPrivate.DefaultExtPrivateCfgProps, ...partial.extPrivate }
    };
}
