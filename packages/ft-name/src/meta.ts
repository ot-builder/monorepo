import { Tag } from "@ot-builder/primitive";

export namespace Meta {
    export const Tag = `meta`;

    export class Table {
        constructor(public data: Array<[Tag, string | Buffer]> = []) {}
    }
}
