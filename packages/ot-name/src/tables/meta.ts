import * as Primitive from "@ot-builder/primitive";

export const Tag = `meta`;

export class Table {
    constructor(public data: Array<[Primitive.Tag, string | Buffer]> = []) {}
}
