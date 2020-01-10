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
export class CffHintImpl implements GeneralGlyph.HintT<OtVar.Value> {
    public hStems: GeneralGlyph.CffHintStemT<OtVar.Value>[] = [];
    public vStems: GeneralGlyph.CffHintStemT<OtVar.Value>[] = [];
    public hintMasks: GeneralGlyph.CffHintMaskT<OtVar.Value>[] = [];
    public counterMasks: GeneralGlyph.CffHintMaskT<OtVar.Value>[] = [];

    public apply<E>(alg: GeneralGlyph.HintAlgT<OtVar.Value, E>): E {
        return alg.cffHint(this);
    }
}
