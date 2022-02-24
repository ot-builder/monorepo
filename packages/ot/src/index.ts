export * from "./font";
export { Sfnt } from "@ot-builder/ot-sfnt";

export { OtVar as Var } from "@ot-builder/variance";

export { Head, Maxp, Os2, MetricHead, Fvar, Post, Avar, Gasp } from "@ot-builder/ot-metadata";

export { OtGlyph as Glyph, Cff, Cvt, Fpgm, Prep } from "@ot-builder/ot-glyphs";
export { OtGlyphNamingSource as GlyphNamingSource } from "@ot-builder/ot-glyphs";
export { OtGlyphNamer as GlyphNamer } from "@ot-builder/ot-glyphs";
export { OtGeometryUtil as GeometryUtil } from "@ot-builder/ot-glyphs";
export { OtStandardGlyphNamer as StandardGlyphNamer } from "@ot-builder/ot-standard-glyph-namer";
export * from "./glyph-store-aliases";

export { Cmap, OtEncoding as Encoding } from "@ot-builder/ot-encoding";
export { Name, Stat, Meta } from "@ot-builder/ot-name";
export { DicingStore, DicingStoreRep } from "@ot-builder/ot-layout";
export { Gdef, Gsub, Gpos, GsubGpos, Base, Math } from "@ot-builder/ot-layout";
export { XPrv } from "@ot-builder/ot-ext-private";
export { TSI0123, TSI5, TSIC } from "@ot-builder/ot-vtt-private";
