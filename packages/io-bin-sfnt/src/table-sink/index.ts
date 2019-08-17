import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";
import { Sfnt } from "@ot-builder/ft-sfnt";

export class SfntIoTableSink {
    constructor(private readonly sfnt: Sfnt) {}

    public add(tag: Tag, data: Data.Maybe<Buffer>, pEmpty?: Data.Maybe<Data.Access.Read<boolean>>) {
        if (!data || !tag || !data.byteLength || (pEmpty && pEmpty.get())) {
            this.sfnt.tables.delete(tag);
        } else {
            this.sfnt.tables.set(tag, data);
        }
    }
}
