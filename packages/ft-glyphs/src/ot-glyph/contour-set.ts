import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

// Geometry types
export class ContourSetImpl implements GeneralGlyph.ContourSetT<OtGlyphInterface, OtVar.Value> {
    constructor(public contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []) {}
    public apply<E>(alg: GeneralGlyph.GeometryAlgT<OtGlyphInterface, OtVar.Value, E>): E {
        return alg.contourSet(this);
    }
}
