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

    export class Range implements OtVar.Rectifiable {
        constructor(
            public maxPPEM: OtVar.Value, // Why?
            public behavior: UInt16
        ) {}
        public rectifyCoords(rec: OtVar.Rectifier) {
            this.maxPPEM = rec.coord(this.maxPPEM);
        }
    }
    export class Table implements OtVar.Rectifiable {
        constructor(public ranges: Range[]) {}
        public rectifyCoords(rec: OtVar.Rectifier) {
            for (const range of this.ranges) {
                range.rectifyCoords(rec);
            }
        }
    }
}
