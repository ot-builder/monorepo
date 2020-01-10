import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

export class TtInstructionHintImpl implements GeneralGlyph.HintT<OtVar.Value> {
    constructor(public instructions: Buffer) {}
    public apply<E>(alg: GeneralGlyph.HintAlgT<OtVar.Value, E>): E {
        return alg.ttInstructions(this);
    }
}
