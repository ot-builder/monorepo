import { Rectify, RectifyImpl, Trace } from "@ot-builder/rectify";

import { LayoutCommon } from "../common";

import { GeneralLookupT } from "./general";

export class GposCursiveLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public attachments: Map<G, LayoutCommon.CursiveAnchorPair.T<X>> = new Map();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.attachments = RectifyImpl.Glyph.mapSome(rec, this.attachments);
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {}
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
        for (const [g, a] of this.attachments) {
            this.attachments.set(g, LayoutCommon.CursiveAnchorPair.rectify(rec, a));
        }
    }
    public cleanupEliminable() {
        return !this.attachments.size;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
