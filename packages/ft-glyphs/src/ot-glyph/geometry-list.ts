import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

type Geometry = GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>;
export class GeometryListImpl
    implements GeneralGlyph.GeometryListT<OtGlyphInterface, OtVar.Value> {
    constructor(public items: Geometry[] = []) {}
    public apply<E>(alg: GeneralGlyph.GeometryAlgT<OtGlyphInterface, OtVar.Value, E>): E {
        let parts: E[] = [];
        for (const item of this.items) parts.push(item.apply(alg));
        return alg.geometryList(parts);
    }
}
