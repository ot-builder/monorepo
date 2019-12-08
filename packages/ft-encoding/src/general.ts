import { Data, Rectify } from "@ot-builder/prelude";

import { EncodingMapImplT } from "./encoding-map-impl";
import { VsEncodingMapImplT } from "./vs-encoding-map-impl";

export interface EncodingMapT<G> {
    readonly size: number;
    get(code: number): Data.Maybe<G>;
    set(code: number, glyph: G): void;
    delete(code: number): void;
    entries(): Iterable<[number, G]>;
}

export interface VsEncodingMapT<G> {
    readonly size: number;
    get(code: number, vs: number): Data.Maybe<G>;
    set(code: number, vs: number, glyph: G): void;
    delete(code: number, vs: number): void;
    entries(): Iterable<[number, number, G]>;
}

export class CharacterMapT<G> {
    public unicode: EncodingMapT<G> = new EncodingMapImplT<G>();
    public vs: VsEncodingMapT<G> = new VsEncodingMapImplT<G>();
}
