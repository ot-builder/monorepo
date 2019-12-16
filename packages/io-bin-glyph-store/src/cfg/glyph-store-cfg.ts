import { OtGlyphNamer } from "@ot-builder/ft-glyphs";

export interface GlyphStoreCfgProps {
    statOs2XAvgCharWidth?: boolean;
}
export interface GlyphStoreCfg {
    glyphStore: GlyphStoreCfgProps;
}
export interface GlyphStoreCfgPt {
    glyphStore?: Partial<GlyphStoreCfgProps>;
}
export const DefaultGlyphStoreCfgProps = { statOs2XAvgCharWidth: true };

export interface GlyphNamingCfgProps {
    namer?: OtGlyphNamer;
}
export interface GlyphNamingCfg {
    glyphNaming: GlyphNamingCfgProps;
}
export interface GlyphNamingCfgPt {
    glyphNaming?: Partial<GlyphNamingCfgProps>;
}
export const DefaultGlyphNamingCfgProps: GlyphNamingCfgProps = {};
