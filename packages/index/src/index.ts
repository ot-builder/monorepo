export { Data } from "@ot-builder/prelude";
export { Rectify, Trace } from "@ot-builder/prelude";

export * from "@ot-builder/cfg-log";

export { Head, Maxp, Os2, MetricHead, Fvar, Post, Avar, Gasp } from "@ot-builder/ft-metadata";

export { OtGlyph, GeneralGlyph } from "@ot-builder/ft-glyphs";
export { Cff, Cvt, FpgmPrep } from "@ot-builder/ft-glyphs";
export { OtGlyphNamingSource, OtGlyphNamer } from "@ot-builder/ft-glyphs";
export { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";

export { Cmap } from "@ot-builder/ft-encoding";
export { Name, Stat, Meta } from "@ot-builder/ft-name";
export { LayoutCommon, Gdef, GsubGpos, Gsub, Gpos, Base } from "@ot-builder/ft-layout";
export { StandardOtGlyphNamer } from "@ot-builder/standard-glyph-namer";

export { OtFont } from "@ot-builder/font";
export { FontIoConfig, readFont, writeFont } from "@ot-builder/io-bin-font";
export { Sfnt } from "@ot-builder/ft-sfnt";
export { readSfntOtf, writeSfntOtf } from "@ot-builder/io-bin-font";
export { traceGlyphs, rectifyFontGlyphs, rectifyFontCoords } from "@ot-builder/rectify-font";

// re-export primitive types from Primitive
import * as OtbPrimitive from "@ot-builder/primitive";
export type Tag = OtbPrimitive.Tag;
export type UInt8 = OtbPrimitive.UInt8;
export type UInt16 = OtbPrimitive.UInt16;
export type UInt24 = OtbPrimitive.UInt24;
export type UInt32 = OtbPrimitive.UInt32;
export type Int8 = OtbPrimitive.Int8;
export type Int16 = OtbPrimitive.Int16;
export type Int24 = OtbPrimitive.Int24;
export type Int32 = OtbPrimitive.Int32;
export type F16D16 = OtbPrimitive.F16D16;
export type F24D6 = OtbPrimitive.F24D6;
export type F2D14 = OtbPrimitive.F2D14;
