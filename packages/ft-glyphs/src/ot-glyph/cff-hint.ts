import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";
import { PointRef } from "../general-glyph/point";

export class CffHintStemImpl {
    constructor(public start: OtVar.Value, public end: OtVar.Value) {}
}
export class CffHintMaskImpl {
    constructor(
        public at: PointRef,
        public maskH: Set<GeneralGlyph.CffHintStemT<OtVar.Value>>,
        public maskV: Set<GeneralGlyph.CffHintStemT<OtVar.Value>>
    ) {}
}
