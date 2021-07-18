import { UInt8, Int16, UInt16 } from "@ot-builder/primitive";

export const Tag = "VDMX";

export interface RatioRange {
    readonly bCharSet: UInt8;
    readonly xRatio: UInt8;
    readonly yStartRatio: UInt8;
    readonly yEndRatio: UInt8;
}

export interface VTableRecord {
    readonly yMax: Int16;
    readonly yMin: Int16;
}

export class VdmxRecord {
    public ratioRange: RatioRange = { bCharSet: 0, xRatio: 0, yStartRatio: 0, yEndRatio: 0 };
    public entries: Map<UInt16, VTableRecord> = new Map();
}

export class Table {
    constructor(public readonly version: UInt16 = 1) {}
    public records: Array<VdmxRecord> = [];
}
