import { RectifyImpl } from "@ot-builder/common-impl";
import { Rectify, Trace } from "@ot-builder/prelude";

import { VsEncodingMapT } from "./general";

export class VsEncodingMapImplT<G> implements VsEncodingMapT<G>, Trace.Glyph.TraceableT<G> {
    private sizeCache: undefined | number = undefined;
    private mapping: Map<number, Map<number, G>> = new Map();

    constructor(init?: Iterable<[number, number, G]>) {
        if (init) {
            for (const [code, vs, glyph] of init) {
                this.set(code, vs, glyph);
            }
        }
    }

    get size() {
        if (this.sizeCache != null) return this.sizeCache;
        this.sizeCache = 0;
        for (const selector of this.mapping.values()) this.sizeCache += selector.size;
        return this.sizeCache;
    }
    public get(code: number, vs: number) {
        const blossom = this.mapping.get(code);
        if (!blossom) return undefined;
        else return blossom.get(vs);
    }
    public set(code: number, vs: number, glyph: G) {
        this.sizeCache = undefined;
        let blossom = this.mapping.get(code);
        if (!blossom) {
            blossom = new Map();
            this.mapping.set(code, blossom);
        }
        blossom.set(vs, glyph);
    }
    public delete(code: number, vs: number) {
        this.sizeCache = undefined;
        let blossom = this.mapping.get(code);
        if (blossom) {
            blossom.delete(vs);
            if (!blossom.size) this.mapping.delete(code);
        }
    }
    public *entries(): IterableIterator<[number, number, G]> {
        for (const [code, blossom] of this.mapping) {
            for (const [vs, glyph] of blossom) {
                yield [code, vs, glyph];
            }
        }
    }

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.mapping = RectifyImpl.mapSomeT(rec, this.mapping, RectifyImpl.Id, (rec, blo) =>
            RectifyImpl.Glyph.comapSome(rec, blo)
        );
    }

    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        for (const [code, vs, glyph] of this.entries()) tracer.add(glyph);
    }
}
