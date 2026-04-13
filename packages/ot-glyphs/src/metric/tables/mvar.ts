import type { OtVar } from "@ot-builder/variance";

export const Tag = "MVAR";
export class Entry {
    public constructor(
        public readonly tag: string,
        public readonly value: OtVar.Value
    ) {}
}
export class Table {
    public constructor(public entries: Entry[] = []) {}
}
