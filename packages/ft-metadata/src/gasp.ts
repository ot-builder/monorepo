import { UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace Gasp {
    export const Tag = `gasp`;

    export enum RangeBehavior {
        GASP_GRIDFIT = 0x0001,
        GASP_DOGRAY = 0x0002,
        GASP_SYMMETRIC_GRIDFIT = 0x0004,
        GASP_SYMMETRIC_SMOOTHING = 0x0008
    }

    export class Range {
        constructor(
            public maxPPEM: OtVar.Value, // Why?
            public behavior: UInt16
        ) {}
    }
    export class Table {
        constructor(public ranges: Range[] = []) {}
    }
}
