import { OtGlyph } from "@ot-builder/ft-glyphs";
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

    export function createMapping(): EncodingMap {
        return new EncodingMapImplT<OtGlyph>();
    }
    export function createVsMapping(): VsEncodingMap {
        return new VsEncodingMapImplT<OtGlyph>();
    }
    export function createVsMappingT<T>(): VsEncodingMapT<T> {
        return new VsEncodingMapImplT<T>();
    }
}

export interface OtEncoding {
    cmap?: Data.Maybe<Cmap.Table>;
}
