import * as crypto from "crypto";

import { alignBufferSize } from "@ot-builder/bin-util";
import { Tag, UInt32 } from "@ot-builder/primitive";

export type TableSlice = {
    data: Buffer;
    start: number;
    length: number;
};
export type TableSliceCollection = {
    readonly version: number;
    tables: Map<string, TableSlice>;
};

export interface TableBlob {
    offset: number;
    content: Buffer;
    checksum: number;
}
export type BlobStore = Map<string, TableBlob>;

export interface TableRecord {
    tag: Tag;
    blob: TableBlob;
    start: number;
    length: number;
}

export function BufferToSlice(buf: Buffer): TableSlice {
    return { data: buf, start: 0, length: buf.byteLength };
}

export function collectTableData(tag: Tag, slice: TableSlice, blobStore: BlobStore): TableRecord {
    // Pad buffer with 0
    const b = alignBufferSize(slice.data, 4);

    const hasher = crypto.createHash("sha256");
    hasher.update(b);
    const hash = hasher.digest("hex");

    const existing = blobStore.get(hash);
    if (existing) {
        return { tag, blob: existing, start: slice.start, length: slice.length };
    } else {
        const blob = { offset: 0, content: b, checksum: calculateChecksum(b) };
        blobStore.set(hash, blob);
        return { tag, blob, start: slice.start, length: slice.length };
    }
}

export function calculateChecksum(buf: Buffer) {
    let checksum = 0;
    for (let mu = 0; mu < buf.length; mu += 4) {
        checksum = UInt32.from(checksum + buf.readUInt32BE(mu));
    }
    return checksum;
}

export function allocateBlobOffsets(store: BlobStore) {
    let offset = 0;
    for (const [hash, blob] of store) {
        blob.offset = offset;
        offset += blob.content.byteLength;
    }
}
