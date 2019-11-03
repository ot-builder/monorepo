import { RectifyImpl } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Rectify } from "@ot-builder/prelude";

export namespace GdefSubParts {
    export type AttachPointsT<G> = Array<OtGlyph.PointIDRef>;
    export type AttachPointListT<G> = Map<G, AttachPointsT<G>>;

    export interface LigCaretT<X> {
        readonly x: X;
        readonly pointAttachment?: Data.Maybe<OtGlyph.PointIDRef>;
        readonly xDevice?: Data.Maybe<ReadonlyArray<number>>;
    }
    export type LigCaretListT<G, X> = Map<G, Array<LigCaretT<X>>>;

    function rectifyLigCaretCoord<X>(
        rec: Rectify.Coord.RectifierT<X>,
        lc: LigCaretT<X>
    ): LigCaretT<X> {
        return { ...lc, x: rec.coord(lc.x) };
    }

    export function rectifyLigCaretArrayCoord<X>(
        r: Rectify.Coord.RectifierT<X>,
        lcs: GdefSubParts.LigCaretT<X>[]
    ) {
        return RectifyImpl.listSomeT(r, lcs, rectifyLigCaretCoord);
    }

    function rectifyLigCaretPointAttachment<G, X>(
        rectifier: Rectify.PointAttach.RectifierT<G, X>,
        context: G,
        lc: LigCaretT<X>
    ): LigCaretT<X> {
        if (!lc.pointAttachment) return lc;

        const desired = rectifier.getGlyphPoint(context, lc.pointAttachment.pointIndex);
        if (!desired) return { ...lc, pointAttachment: null };

        const accept = rectifier.acceptOffset(desired, lc);
        if (accept.x) return lc;

        switch (rectifier.manner) {
            case Rectify.PointAttach.Manner.TrustAttachment:
                return { ...lc, x: desired.x };
            case Rectify.PointAttach.Manner.TrustCoordinate:
                return { ...lc, pointAttachment: null };
        }
    }

    function rectifyLigCaretArrayPointAttachment<G, X>(
        rec: Rectify.PointAttach.RectifierT<G, X>,
        g: G,
        lcs: LigCaretT<X>[]
    ) {
        return RectifyImpl.listSomeT(rec, lcs, (rec, lc) =>
            rectifyLigCaretPointAttachment(rec, g, lc)
        );
    }

    export function rectifyLigCaretListPointAttachment<G, X>(
        rec: Rectify.PointAttach.RectifierT<G, X>,
        lcs: LigCaretListT<G, X>
    ) {
        return RectifyImpl.mapSome2T(rec, lcs, RectifyImpl.Id, rectifyLigCaretArrayPointAttachment);
    }
}
