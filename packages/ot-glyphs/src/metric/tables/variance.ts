import { OtVar } from "@ot-builder/variance";

export const TagHvar = "HVAR";
export const TagVvar = "VVAR";

export class Measure {
    constructor(public start: OtVar.Value = 0, public advance: OtVar.Value = 0) {}
}

export class Table {
    constructor(public readonly isVertical: boolean) {}
    public measures: Measure[] = [];
}
