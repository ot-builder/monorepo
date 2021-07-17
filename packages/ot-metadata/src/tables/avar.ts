import { OtVar } from "@ot-builder/variance";

export const Tag = "avar";

export type SegmentMap = [number, number][];

export class Table {
    constructor(public segmentMaps: Map<OtVar.Dim, SegmentMap> = new Map()) {}
}
