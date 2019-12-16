import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { TID_TtInstructionHint } from "./type-id";

export class TtInstructionHintImpl implements GeneralGlyph.HintT<OtVar.Value> {
    constructor(public instructions: Buffer) {}
    public queryInterface<U>(tid: Caster.TypeID<U>): undefined | U {
        return Caster.StandardQueryInterface(this, tid, TID_TtInstructionHint);
    }
    public acceptHintAlgebra<E>(alg: GeneralGlyph.HintAlgT<OtVar.Value, E>): E {
        return alg.ttInstructions(this);
    }
}
