import * as OtbPrimitive from "@ot-builder/primitive";

import * as _Ot from "./ot";
export import Ot = _Ot;

export { Data, Caster, Rectify, Trace } from "@ot-builder/prelude";

export * from "@ot-builder/cfg-log";

export { FontIoConfig, readFont, writeFont } from "@ot-builder/io-bin-font";
export { readSfntOtf, writeSfntOtf } from "@ot-builder/io-bin-font";
export { traceGlyphs, rectifyFontGlyphs, rectifyFontCoords } from "@ot-builder/rectify-font";

// re-export primitive types from Primitive
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
