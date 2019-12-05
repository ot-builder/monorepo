import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

// Hints and hint visitors
export const TID_TtfInstructionHintVisitor = new Caster.TypeID<TtfInstructionHintVisitor>(
    "OTB::TrueType::TID_TtfInstructionHintVisitor"
);
export interface TtfInstructionHintVisitor extends GeneralGlyph.HintVisitorT<OtVar.Value> {
    addInstructions(buffer: Buffer): void;
}
export class TtfInstructionHint implements GeneralGlyph.HintT<OtVar.Value> {
    constructor(public instructions: Buffer) {}
    public rectifyCoords(rectify: OtVar.Rectifier) {}
    public acceptHintVisitor(hv: GeneralGlyph.HintVisitorT<OtVar.Value>) {
        const visitor = hv.queryInterface(TID_TtfInstructionHintVisitor);
        if (!visitor) return;
        visitor.begin();
        visitor.addInstructions(this.instructions);
        visitor.end();
    }
    public duplicate() {
        return new TtfInstructionHint(Buffer.from(this.instructions));
    }
}
