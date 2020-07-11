import { Read, Write, Frag } from "@ot-builder/bin-util";
import { XPrv } from "@ot-builder/ot-ext-private";

export const ReadBlob = Read<XPrv.Blob>(view => {
    const nEntries = view.uint32();
    const map: XPrv.Blob = new Map();
    for (let id = 0; id < nEntries; id++) {
        const nameSize = view.uint32();
        const dataSize = view.uint32();
        const pNameStr = view.ptr32().bytes(nameSize).toString("utf-8");
        const pData = view.ptr32().bytes(dataSize);
        map.set(pNameStr, pData);
    }
    return map;
});

export const WriteBlob = Write<XPrv.Blob>((fr, blob) => {
    fr.uint32(blob.size);
    for (const [name, data] of blob) {
        const bName = Buffer.from(name, "utf-8");
        const frName = new Frag().bytes(bName);
        const frData = new Frag().bytes(data);
        fr.uint32(bName.byteLength) // nameSize
            .uint32(data.byteLength) // dataSize
            .ptr32(frName) // nameStr
            .ptr32(frData); // data
    }
});
