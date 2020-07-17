import { OtVar } from "@ot-builder/variance";

export namespace Mvar {
    export const Tag = "MVAR";
    export class Entry {
        constructor(public readonly tag: string, public readonly value: OtVar.Value) {}
    }
    export class Table {
        constructor(public entries: Entry[] = []) {}
    }
}
