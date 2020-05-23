export * as CliProc from "@ot-builder/cli-proc";
export * as FontIo from "@ot-builder/io-bin-font";
export * as Ot from "@ot-builder/ot";
export { Data, Sigma } from "@ot-builder/prelude";
export * as Rectify from "@ot-builder/rectify";
export * as Trace from "@ot-builder/trace";

// re-export primitive types from Primitive
import * as PrimitiveLib from "@ot-builder/primitive";

export type Tag = PrimitiveLib.Tag;
export type UInt8 = PrimitiveLib.UInt8;
export type UInt16 = PrimitiveLib.UInt16;
export type UInt24 = PrimitiveLib.UInt24;
export type UInt32 = PrimitiveLib.UInt32;
export type Int8 = PrimitiveLib.Int8;
export type Int16 = PrimitiveLib.Int16;
export type Int24 = PrimitiveLib.Int24;
export type Int32 = PrimitiveLib.Int32;
export type F16D16 = PrimitiveLib.F16D16;
export type F24D6 = PrimitiveLib.F24D6;
export type F2D14 = PrimitiveLib.F2D14;
