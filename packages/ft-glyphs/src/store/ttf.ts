import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

// Shared typedef for "fpgm" and "prep"
export namespace FpgmPrep {
    export const TagFpgm = "fpgm";
    export const TagPrep = "prep";
    export class Table {
        constructor(public instructions: Buffer) {}
    }
}

export namespace Cvt {
    export const Tag = "cvt ";
    export const TagVar = "cvar";
    export class Table implements OtVar.Rectifiable {
        constructor(public items: OtVar.Value[] = []) {}
        public rectifyCoords(rec: OtVar.Rectifier) {
            this.items = this.items.map(x => rec.cv(x));
        }
    }
}

export interface TtfCoGlyphs {
    fpgm?: Data.Maybe<FpgmPrep.Table>;
    prep?: Data.Maybe<FpgmPrep.Table>;
    cvt?: Data.Maybe<Cvt.Table>;
}
