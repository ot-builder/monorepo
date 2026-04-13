import type { Sfnt } from "@ot-builder/ot-sfnt";
import type { Data } from "@ot-builder/prelude";
import type { Tag } from "@ot-builder/primitive";

export class SfntIoTableSink {
    public constructor(private readonly sfnt: Sfnt) {}

    public add(tag: Tag, data: Data.Maybe<Buffer>) {
        if (!data || !tag || !data.byteLength) {
            this.sfnt.tables.delete(tag);
        } else {
            this.sfnt.tables.set(tag, data);
        }
    }
}
