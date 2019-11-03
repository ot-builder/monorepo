import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Rectify } from "@ot-builder/prelude";

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
    export function rectify<X>(rec: Rectify.Coord.RectifierT<X>, anc: T<X>) {
        return { ...anc, x: rec.coord(anc.x), y: rec.coord(anc.y) };
    }
    export function rectifyPointAttachment<G, X>(
        rectifier: Rectify.PointAttach.RectifierT<G, X>,
        context: G,
        z: T<X>
    ) {
        if (!z.attachToPoint) return z;
        const desired = rectifier.getGlyphPoint(context, z.attachToPoint.pointIndex);
        if (!desired) return { ...z, attachToPoint: null };
        const accept = rectifier.acceptOffset(desired, z);
        if (accept.x && accept.y) return z;
        switch (rectifier.manner) {
            case Rectify.PointAttach.Manner.TrustAttachment:
                return { ...z, x: desired.x, y: desired.y };
            case Rectify.PointAttach.Manner.TrustCoordinate:
                return { ...z, attachToPoint: null };
        }
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
    export function rectifyPointAttachment<G, X>(
        rectifier: Rectify.PointAttach.RectifierT<G, X>,
        context: G,
        ap: T<X>
    ) {
        return {
            entry: !ap.entry
                ? ap.entry
                : LayoutAnchor.rectifyPointAttachment(rectifier, context, ap.entry),
            exit: !ap.exit
                ? ap.exit
                : LayoutAnchor.rectifyPointAttachment(rectifier, context, ap.exit)
        };
    }
}
