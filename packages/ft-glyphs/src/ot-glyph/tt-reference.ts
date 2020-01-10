import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";
import { PointAttachment } from "../general-glyph/point";

import { OtGlyphInterface } from "./glyph-interface";

export class TtReferenceImpl implements GeneralGlyph.TtReferenceT<OtGlyphInterface, OtVar.Value> {
    constructor(
        public to: OtGlyphInterface,
        public transform: GeneralGlyph.Transform2X3.T<OtVar.Value>
    ) {}
    public roundXyToGrid = false;
    public useMyMetrics = false;
    public overlapCompound = false;
    public pointAttachment: Data.Maybe<PointAttachment> = null;

    public apply<E>(alg: GeneralGlyph.GeometryAlgT<OtGlyphInterface, OtVar.Value, E>): E {
        return alg.ttReference(this);
    }
}
