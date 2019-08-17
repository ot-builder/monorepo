import { Tag, UInt32 } from "@ot-builder/primitive";

export class Sfnt {
    constructor(public version: UInt32) {}
    public tables = new Map<Tag, Buffer>();
}
