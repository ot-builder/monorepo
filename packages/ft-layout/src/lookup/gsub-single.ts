import { Rectify, RectifyImpl, Trace } from "@ot-builder/rectify";

import { GeneralLookupT } from "./general";

export class GsubSingleLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Map<G, G> = new Map();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.mapping = RectifyImpl.Glyph.bimapSome(rec, this.mapping);
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const [src, dst] of this.mapping) {
            if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
        }
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public cleanupEliminable() {
        return !this.mapping.size;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
