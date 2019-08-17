import { Config } from "@ot-builder/cfg-log";
import { DefaultEncodingCfg, EncodingCfg, EncodingCfgPt } from "@ot-builder/io-bin-encoding";
import {
    CffCfg,
    CffCfgPt,
    DefaultCffCfgProps,
    DefaultGlyphNamingCfgProps,
    DefaultGlyphStoreCfgProps,
    DefaultTtfCfgProps,
    GlyphNamingCfg,
    GlyphNamingCfgPt,
    GlyphStoreCfg,
    GlyphStoreCfgPt,
    TtfCfg,
    TtfCfgPt
} from "@ot-builder/io-bin-glyph-store";
import {
    DefaultFontMetadataCfgProps,
    FontMetadataCfg,
    FontMetadataCfgPt
} from "@ot-builder/io-bin-metadata";

export type FontIoCfgFinal = CffCfg &
    TtfCfg &
    FontMetadataCfg &
    GlyphStoreCfg &
    EncodingCfg &
    GlyphNamingCfg;
export type FontIoConfig = FontMetadataCfgPt &
    GlyphStoreCfgPt &
    CffCfgPt &
    TtfCfgPt &
    EncodingCfgPt &
    GlyphNamingCfgPt;

export function createConfig(partial: Config<FontIoConfig>): Config<FontIoCfgFinal> {
    return Config.create({
        cff: { ...DefaultCffCfgProps, ...partial.cff },
        ttf: { ...DefaultTtfCfgProps, ...partial.ttf },
        fontMetadata: { ...DefaultFontMetadataCfgProps, ...partial.fontMetadata },
        glyphStore: { ...DefaultGlyphStoreCfgProps, ...partial.glyphStore },
        glyphNaming: { ...DefaultGlyphNamingCfgProps, ...partial.glyphNaming },
        encoding: { ...DefaultEncodingCfg, ...partial.encoding }
    });
}
