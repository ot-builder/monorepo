import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";
import { TID_GeometryList } from "./type-id";

type Geometry = GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>;
export class GeometryListImpl implements GeneralGlyph.GeometryListT<OtGlyphInterface, OtVar.Value> {
    constructor(public items: Geometry[] = []) {}
    public queryInterface<U>(tid: Caster.TypeID<U>): undefined | U {
        return Caster.StandardQueryInterface(this, tid, TID_GeometryList);
    }
    public acceptGeometryAlgebra<E>(
        alg: GeneralGlyph.GeometryAlgT<OtGlyphInterface, OtVar.Value, E>
    ): E {
        let parts: E[] = [];
        for (const item of this.items) parts.push(item.acceptGeometryAlgebra(alg));
        return alg.geometryList(parts);
    }
}
