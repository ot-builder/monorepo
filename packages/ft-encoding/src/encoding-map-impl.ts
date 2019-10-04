import { Rectify, Trace } from "@ot-builder/prelude";

import { EncodingMapT } from "./general";

export class EncodingMapImplT<G> implements EncodingMapT<G>, Trace.Glyph.TraceableT<G> {
    private mapping: Map<number, G> = new Map();

    get size() {
        return this.mapping.size;
    }
    public get(code: number) {
        return this.mapping.get(code | 0);
    }
    public set(code: number, glyph: G) {
        this.mapping.set(code | 0, glyph);
    }
    public delete(code: number) {
        this.mapping.delete(code | 0);
    }
    public *entries(): IterableIterator<[number, G]> {
        yield* this.mapping.entries();
    }

    public rectifyGlyphs(rectify: Rectify.Glyph.RectifierT<G>) {
        for (const [encoding, glyph] of this.mapping) {
            const g1 = rectify.glyph(glyph);
            if (g1) this.mapping.set(encoding, g1);
            else this.mapping.delete(encoding);
        }
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const [encoding, glyph] of this.mapping) {
            if (!tracer.has(glyph)) tracer.add(glyph);
        }
    }
}
