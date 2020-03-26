import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

export class SfntIoTableSink {
    constructor(private readonly sfnt: Sfnt) {}

    public add(tag: Tag, data: Data.Maybe<Buffer>) {
        if (!data || !tag || !data.byteLength) {
            this.sfnt.tables.delete(tag);
        } else {
            this.sfnt.tables.set(tag, data);
        }
    }
}
