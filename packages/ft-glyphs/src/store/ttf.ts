import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export namespace Fpgm {
    export const Tag = "fpgm";
    export class Table {
        constructor(public instructions: Buffer) {}
    }
}
export namespace Prep {
    export const Tag = "prep";
    export class Table {
        constructor(public instructions: Buffer) {}
    }
}

export namespace Cvt {
    export const Tag = "cvt ";
    export const TagVar = "cvar";
    export class Table {
        constructor(public items: OtVar.Value[] = []) {}
    }
}

export interface TtfCoGlyphs {
    fpgm?: Data.Maybe<Fpgm.Table>;
    prep?: Data.Maybe<Prep.Table>;
    cvt?: Data.Maybe<Cvt.Table>;
}
