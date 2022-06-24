import { Data } from "@ot-builder/prelude";

// 2x3 Transformation like this
// ⎛ xx yx | dx ⎞
// ⎝ xy yy | dy ⎠

export interface T<X> {
    readonly scaledOffset?: Data.Maybe<boolean>; // Scale offsets or not?
    readonly xx: number; // X scale
    readonly yx: number; // X shear
    readonly xy: number; // Y shear
    readonly yy: number; // Y scale
    readonly dx: X; // X displacement
    readonly dy: X; // Y displacement
}
