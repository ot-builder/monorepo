import { RectifyImpl } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Rectify } from "@ot-builder/prelude";

export namespace BaseSubParts {
    // Base coord
    export interface CoordT<G, X> {
        readonly at: X;
        readonly pointAttachment?: Data.Maybe<OtGlyph.GlyphPointIDRef<G>>;
        readonly deviceDeltas?: Data.Maybe<ReadonlyArray<number>>;
    }

    export function rectifyBaseCoordCoord<G, X>(
        rec: Rectify.Coord.RectifierT<X>,
        lc: CoordT<G, X>
    ): CoordT<G, X> {
        return { ...lc, at: rec.coord(lc.at) };
    }

    export function rectifyBaseCoordGlyph<G, X>(
        rec: Rectify.Glyph.RectifierT<G>,
        lc: CoordT<G, X>
    ): CoordT<G, X> {
        if (!lc.pointAttachment) return lc;
        const g1 = rec.glyph(lc.pointAttachment.glyph);
        if (!g1) return { ...lc, pointAttachment: null };
        else return { ...lc, pointAttachment: { ...lc.pointAttachment, glyph: g1 } };
    }

    export function rectifyBaseCoordPointAttach<G, X>(
        rec: Rectify.PointAttach.RectifierT<G, X>,
        lc: CoordT<G, X>,
        horizontal: boolean
    ): CoordT<G, X> {
        if (!lc.pointAttachment) return lc;

        const desired = rec.getGlyphPoint(lc.pointAttachment.glyph, lc.pointAttachment.pointIndex);
        if (!desired) return { ...lc, pointAttachment: null };

        const accept = horizontal
            ? rec.acceptOffset(desired, { y: lc.at })
            : rec.acceptOffset(desired, { x: lc.at });
        if (horizontal ? accept.y : accept.x) return lc;

        switch (rec.manner) {
            case Rectify.PointAttach.Manner.TrustAttachment:
                if (horizontal) return { ...lc, at: desired.y };
                else return { ...lc, at: desired.x };
            case Rectify.PointAttach.Manner.TrustCoordinate:
                return { ...lc, pointAttachment: null };
        }
    }

    // Min-max value pair
    export interface MinMaxValueT<G, X> {
        readonly minCoord: Data.Maybe<CoordT<G, X>>;
        readonly maxCoord: Data.Maybe<CoordT<G, X>>;
    }
    export function rectifyMinMaxValueCoord<G, X>(
        rec: Rectify.Coord.RectifierT<X>,
        lc: MinMaxValueT<G, X>
    ): MinMaxValueT<G, X> {
        return {
            minCoord: RectifyImpl.maybeT(rec, lc.minCoord, rectifyBaseCoordCoord),
            maxCoord: RectifyImpl.maybeT(rec, lc.maxCoord, rectifyBaseCoordCoord)
        };
    }
    export function rectifyMinMaxValueGlyph<G, X>(
        rec: Rectify.Glyph.RectifierT<G>,
        lc: MinMaxValueT<G, X>
    ): MinMaxValueT<G, X> {
        return {
            minCoord: RectifyImpl.maybeT(rec, lc.minCoord, rectifyBaseCoordGlyph),
            maxCoord: RectifyImpl.maybeT(rec, lc.maxCoord, rectifyBaseCoordGlyph)
        };
    }
    export function rectifyMinMaxValuePointAttach<G, X>(
        rec: Rectify.PointAttach.RectifierT<G, X>,
        lc: MinMaxValueT<G, X>,
        horizontal: boolean
    ): MinMaxValueT<G, X> {
        return {
            minCoord: RectifyImpl.maybeT(rec, lc.minCoord, (rec, lc) =>
                rectifyBaseCoordPointAttach(rec, lc, horizontal)
            ),
            maxCoord: RectifyImpl.maybeT(rec, lc.maxCoord, (rec, lc) =>
                rectifyBaseCoordPointAttach(rec, lc, horizontal)
            )
        };
    }
}
