import { Data } from "@ot-builder/prelude";

// 2x3 Transformation like this
// / xx yx dx \
// \ xy yy dy /

export interface T<X> {
    readonly scaledOffset?: Data.Maybe<boolean>; // Scale offsets or not?
    readonly xx: number; // H scale
    readonly yx: number; // H shear
    readonly xy: number; // V shear
    readonly yy: number; // V scale
    readonly dx: X; // X displacement
    readonly dy: X; // Y displacement
}
