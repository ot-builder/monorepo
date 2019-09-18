import { Rectify, RectifyImpl, Trace } from "@ot-builder/rectify";

import { LayoutCommon } from "../common";

import { GeneralLookupT } from "./general";

export class GposSingleLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public adjustments: Map<G, LayoutCommon.Adjust.T<X>> = new Map();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.adjustments = RectifyImpl.Glyph.mapSome(rec, this.adjustments);
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {}
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
        for (const [g, a] of this.adjustments) {
            this.adjustments.set(g, LayoutCommon.Adjust.rectify(rec, a));
        }
    }
    public cleanupEliminable() {
        return !this.adjustments.size;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
