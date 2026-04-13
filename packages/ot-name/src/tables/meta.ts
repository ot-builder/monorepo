import type * as Primitive from "@ot-builder/primitive";

export const Tag = `meta`;

export class Table {
    public constructor(public data: Array<[Primitive.Tag, string | Buffer]> = []) {}
}
