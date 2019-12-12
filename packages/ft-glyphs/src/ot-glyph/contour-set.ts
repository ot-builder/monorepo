import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";
import { TID_ContourSet } from "./type-id";

// Geometry types
export class ContourSetImpl implements GeneralGlyph.ContourSetT<OtGlyphInterface, OtVar.Value> {
    constructor(public contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []) {}
    public queryInterface<U>(tid: Caster.TypeID<U>): undefined | U {
        return Caster.StandardQueryInterface(this, tid, TID_ContourSet);
    }
    public acceptGeometryAlgebra<E>(
        alg: GeneralGlyph.GeometryAlgT<OtGlyphInterface, OtVar.Value, E>
    ): E {
        return alg.contourSet(this);
    }
}
