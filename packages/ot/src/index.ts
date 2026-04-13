export { Cmap, OtEncoding as Encoding } from "@ot-builder/ot-encoding";
export { XPrv } from "@ot-builder/ot-ext-private";
export {
    Cff,
    Cvt,
    Fpgm,
    OtGeometryUtil as GeometryUtil,
    OtGlyph as Glyph,
    OtGlyphNamer as GlyphNamer,
    OtGlyphNamingSource as GlyphNamingSource,
    Prep
} from "@ot-builder/ot-glyphs";
export {
    Base,
    DicingStore,
    DicingStoreRep,
    Gdef,
    Gpos,
    Gsub,
    GsubGpos,
    Math
} from "@ot-builder/ot-layout";
export { Avar, Fvar, Gasp, Head, Maxp, MetricHead, Os2, Post } from "@ot-builder/ot-metadata";
export { Meta, Name, Stat } from "@ot-builder/ot-name";
export { Sfnt } from "@ot-builder/ot-sfnt";
export { OtStandardGlyphNamer as StandardGlyphNamer } from "@ot-builder/ot-standard-glyph-namer";
export { TSI5, TSI0123, TSIC } from "@ot-builder/ot-vtt-private";
export { OtVar as Var } from "@ot-builder/variance";

export * from "./font";
export * from "./glyph-store-aliases";
