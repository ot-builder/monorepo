import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

export namespace LayoutAnchor {
    export interface T<X> {
        readonly x: X;
        readonly y: X;
        readonly attachToPoint?: Data.Maybe<OtGlyph.PointIDRef>;
        readonly xDevice?: Data.Maybe<ReadonlyArray<number>>;
        readonly yDevice?: Data.Maybe<ReadonlyArray<number>>;
    }
    export interface WT<X> {
        x: X;
        y: X;
        attachToPoint?: Data.Maybe<OtGlyph.PointIDRef>;
        xDevice?: Data.Maybe<ReadonlyArray<number>>;
        yDevice?: Data.Maybe<ReadonlyArray<number>>;
    }
}

export namespace LayoutCursiveAnchorPair {
    export interface T<X> {
        readonly entry: Data.Maybe<LayoutAnchor.T<X>>;
        readonly exit: Data.Maybe<LayoutAnchor.T<X>>;
    }
}
