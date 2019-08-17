import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Rectify } from "@ot-builder/rectify";

import { DeviceTable } from "./adjust";

export namespace LayoutAnchor {
    export interface T<X> {
        readonly x: X;
        readonly y: X;
        readonly attachToPoint?: Data.Maybe<OtGlyph.PointIDRef>;
        readonly xDevice?: Data.Maybe<DeviceTable>;
        readonly yDevice?: Data.Maybe<DeviceTable>;
    }
    export type WT<X> = Data.Writable<T<X>>;
    export function rectify<X>(rec: Rectify.Coord.RectifierT<X>, anc: T<X>) {
        return { ...anc, x: rec.coord(anc.x), y: rec.coord(anc.y) };
    }
}

export namespace LayoutCursiveAnchorPair {
    export interface T<X> {
        readonly entry: Data.Maybe<LayoutAnchor.T<X>>;
        readonly exit: Data.Maybe<LayoutAnchor.T<X>>;
    }
    export function rectify<X>(rec: Rectify.Coord.RectifierT<X>, ap: T<X>) {
        return {
            entry: !ap.entry ? ap.entry : LayoutAnchor.rectify(rec, ap.entry),
            exit: !ap.exit ? ap.exit : LayoutAnchor.rectify(rec, ap.exit)
        };
    }
}
