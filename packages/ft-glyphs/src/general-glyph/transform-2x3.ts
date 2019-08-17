import { Data } from "@ot-builder/prelude";

// 2x3 Transformation like this
// / xx yx dx \
// \ xy yy dy /

export namespace Transform2X3 {
    export interface T<X> {
        readonly scaledOffset?: Data.Maybe<boolean>; // Scale offsets or not?
        readonly xx: number;
        readonly xy: number;
        readonly yx: number;
        readonly yy: number;
        readonly dx: X;
        readonly dy: X;
    }
}
