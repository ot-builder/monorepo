import { UInt8, Int16, UInt16 } from "@ot-builder/primitive";

export namespace Vdmx {
    export const Tag = "VDMX";

    export class RatioRange {
        bCharSet: UInt8 = 0;
        xRatio: UInt8 = 0;
        yStartRatio: UInt8 = 0;
        yEndRatio: UInt8 = 0;
    }

    export class VTableRecord {
        yMax: Int16 = 0;
        yMin: Int16 = 0;
    }

    export class VdmxRecord {
        ratioRange: RatioRange = new RatioRange();
        entries: Map<UInt16, VTableRecord> = new Map();
    }

    export class Table {
        constructor(public readonly version: UInt16 = 1) { }
        records: Array<VdmxRecord> = new Array();
    }
}
