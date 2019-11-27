import { RectifyImpl } from "@ot-builder/common-impl";
import { Rectify, Trace } from "@ot-builder/prelude";

import { GeneralLookupT } from "./general";

export type GsubLigatureLookupEntryT<G> = {
    readonly from: ReadonlyArray<G>;
    readonly to: G;
};
export class GsubLigatureLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Array<GsubLigatureLookupEntryT<G>> = [];

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);

        const mapping1: Array<GsubLigatureLookupEntryT<G>> = [];
        for (const { from, to } of this.mapping) {
            const dst1 = rec.glyph(to);
            if (!dst1) continue;
            const src1 = RectifyImpl.Glyph.listAll(rec, from);
            if (!src1) continue;
            mapping1.push({ from: src1, to: dst1 });
        }
        this.mapping = mapping1;
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const { from, to } of this.mapping) {
            let found = true;
            for (const part of from) if (!tracer.has(part)) found = false;
            if (found && !tracer.has(to)) tracer.add(to);
        }
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public cleanupEliminable() {
        return ![...this.mapping.entries()].length;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
    public rectifyPointAttachment() {}
}
