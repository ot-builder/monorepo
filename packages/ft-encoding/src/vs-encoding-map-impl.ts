import { VsEncodingMapT } from "./general";

export class VsEncodingMapImplT<G> implements VsEncodingMapT<G> {
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
        const blossom = this.mapping.get(vs);
        if (!blossom) return undefined;
        else return blossom.get(code);
    }
    public set(code: number, vs: number, glyph: G) {
        this.sizeCache = undefined;
        let blossom = this.mapping.get(vs);
        if (!blossom) {
            blossom = new Map();
            this.mapping.set(vs, blossom);
        }
        blossom.set(code, glyph);
    }
    public delete(code: number, vs: number) {
        this.sizeCache = undefined;
        const blossom = this.mapping.get(vs);
        if (blossom) {
            blossom.delete(code);
            if (!blossom.size) this.mapping.delete(vs);
        }
    }
    public *entries(): IterableIterator<[number, number, G]> {
        for (const [vs, blossom] of this.mapping) {
            for (const [code, glyph] of blossom) {
                yield [code, vs, glyph];
            }
        }
    }
}
