import { ImpLib, RectifyImpl } from "@ot-builder/common-impl";
import { Data, Rectify, Trace } from "@ot-builder/prelude";

import { GeneralLookupT } from "./general";

export class GsubLigatureLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Data.PathMap<G, G> = new ImpLib.PathMapImpl();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);

        const mapping1: Data.PathMap<G, G> = new ImpLib.PathMapImpl();
        for (const [src, dst] of this.mapping.entries()) {
            const dst1 = rec.glyph(dst);
            if (!dst1) continue;
            const src1 = RectifyImpl.Glyph.listAll(rec, src);
            if (!src1) continue;
            mapping1.set(src1, dst1);
        }
        this.mapping = mapping1;
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const [src, dst] of this.mapping.entries()) {
            let found = true;
            for (const part of src) if (!tracer.has(part)) found = false;
            if (found && !tracer.has(dst)) tracer.add(dst);
        }
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public cleanupEliminable() {
        return ![...this.mapping.entries()].length;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
