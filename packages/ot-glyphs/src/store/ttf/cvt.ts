import type { OtVar } from "@ot-builder/variance";

export const Tag = "cvt ";
export const TagVar = "cvar";
export class Table {
    public constructor(public items: OtVar.Value[] = []) {}
}
