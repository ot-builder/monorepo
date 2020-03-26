import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { EncodingMapImplT } from "./encoding-map-impl";
import { CharacterMapT, EncodingMapT, VsEncodingMapT } from "./general";
import { VsEncodingMapImplT } from "./vs-encoding-map-impl";

export namespace Cmap {
    export const Tag = "cmap";

    export type EncodingMap = EncodingMapT<OtGlyph>;
    export type VsEncodingMap = VsEncodingMapT<OtGlyph>;
    export type GeneralVsEncodingMapT<T> = VsEncodingMapT<T>;

    export class Table extends CharacterMapT<OtGlyph> {}

    export function createMapping(init?: Iterable<[number, OtGlyph]>): EncodingMap {
        return new EncodingMapImplT<OtGlyph>(init);
    }
    export function createVsMapping(init?: Iterable<[number, number, OtGlyph]>): VsEncodingMap {
        return new VsEncodingMapImplT<OtGlyph>(init);
    }
    export function createVsMappingT<T>(init?: Iterable<[number, number, T]>): VsEncodingMapT<T> {
        return new VsEncodingMapImplT<T>(init);
    }
}

export interface OtEncoding {
    cmap?: Data.Maybe<Cmap.Table>;
}
