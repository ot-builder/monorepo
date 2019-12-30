import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Meta } from "@ot-builder/ft-name";
import { Tag } from "@ot-builder/primitive";
import * as iconv from "iconv-lite";

export const MetaTableIo = {
    read(view: BinaryView) {
        const version = view.uint32();
        Assert.VersionSupported(`MetaTable`, version, 1);
        const flags = view.uint32();
        const reserved = view.uint32();
        const dataMapsCount = view.uint32();
        return new Meta.Table(view.array(dataMapsCount, DataMap));
    },
    write(frag: Frag, table: Meta.Table) {
        Assert.NoGap(`MetaTable::Data`, table.data);
        frag.uint32(1)
            .uint32(0)
            .uint32(0)
            .uint32(table.data.length)
            .array(DataMap, table.data);
    }
};

const DataMap = {
    read(view: BinaryView): [Tag, string | Buffer] {
        const tag = view.next(Tag);
        const vwData = view.ptr32();
        const dataLength = view.uint32();
        if (KnownTextTags.has(tag)) {
            return [tag, iconv.decode(vwData.bytes(dataLength), KnownTextTags.get(tag)!)];
        } else {
            return [tag, vwData.bytes(dataLength)];
        }
    },
    write(frag: Frag, [tag, data]: [Tag, string | Buffer]) {
        frag.push(Tag, tag);
        const fData = frag.ptr32New();
        if (typeof data === "string") {
            const bufData = iconv.encode(data, KnownTextTags.get(tag) || "utf8");
            fData.bytes(bufData);
            frag.uint32(bufData.byteLength);
        } else {
            fData.bytes(data);
            frag.uint32(data.byteLength);
        }
    }
};

const KnownTextTags = new Map([
    [`dlng`, `utf8`], // Design languages
    [`slng`, `utf8`] // Supported languages
]);
