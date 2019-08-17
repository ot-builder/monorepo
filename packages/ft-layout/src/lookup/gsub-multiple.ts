import { Rectify, Trace } from "@ot-builder/rectify";

import { GeneralLookupT } from "./general";

export class GsubMultipleLookupBaseT<G, X, L> {
    public mapping: Map<G, ReadonlyArray<G>> = new Map();

    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const [src, dst] of this.mapping.entries()) {
            if (tracer.has(src)) for (const g of dst) if (!tracer.has(g)) tracer.add(g);
        }
    }
    public cleanupEliminable() {
        return !this.mapping.size;
    }
}

export class GsubMultipleLookupT<G, X, L> extends GsubMultipleLookupBaseT<G, X, L>
    implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = Rectify.Glyph.setSome(rec, this.ignoreGlyphs);
        this.mapping = Rectify.Glyph.mapSomeT(rec, this.mapping, Rectify.Glyph.listAll);
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}

export class GsubAlternateLookupT<G, X, L> extends GsubMultipleLookupBaseT<G, X, L>
    implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = Rectify.Glyph.setSome(rec, this.ignoreGlyphs);
        this.mapping = Rectify.Glyph.mapSomeT(rec, this.mapping, Rectify.Glyph.listSome);
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
