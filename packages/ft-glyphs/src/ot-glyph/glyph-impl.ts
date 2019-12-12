import { Data, Delay } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

export interface OtGlyph extends GeneralGlyph.GlyphT<OtGlyph, OtVar.Value> {
    name?: string;
}

export class OtGlyphImpl implements OtGlyphInterface {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometry: Data.Maybe<GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>> = null;
    public hints: Data.Maybe<GeneralGlyph.HintT<OtVar.Value>> = null;

    public acceptGlyphAlgebra<E, EG, EH>(
        alg: GeneralGlyph.GlyphAlgT<OtGlyphInterface, OtVar.Value, E, EG, EH>
    ): E {
        const geom = this.geometry;
        const hints = this.hints;
        const algGeom = alg.geometryAlgebra;
        const algHints = alg.hintAlgebra;

        return alg.glyph(
            this.horizontal,
            this.vertical,
            geom && algGeom ? Delay(() => geom.acceptGeometryAlgebra(algGeom)) : undefined,
            hints && algHints ? Delay(() => hints.acceptHintAlgebra(algHints)) : undefined
        );
    }
}
