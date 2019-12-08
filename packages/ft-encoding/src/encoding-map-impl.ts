import { EncodingMapT } from "./general";

export class EncodingMapImplT<G> implements EncodingMapT<G> {
    private mapping: Map<number, G> = new Map();
    constructor(init?: Iterable<[number, G]>) {
        if (init) {
            for (const [code, glyph] of init) {
                this.set(code, glyph);
            }
        }
    }

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
}
