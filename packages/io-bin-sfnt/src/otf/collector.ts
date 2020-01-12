import * as crypto from "crypto";
import { alignBufferSize, BufferWriter } from "@ot-builder/bin-util";
import { Tag, UInt32 } from "@ot-builder/primitive";

export interface TableBlob {
    offset: number;
    content: Buffer;
    checksum: number;
}
export type BlobStore = Map<string, TableBlob>;
export interface TableRecord {
    tag: Tag;
    blob: TableBlob;
    length: number;
}

export function collectTableData(tag: Tag, buf: Buffer, blobStore: BlobStore): TableRecord {
    // Pad buffer with 0

    const originalLength = buf.byteLength;
    const b = alignBufferSize(buf, 4);

    const hasher = crypto.createHash("sha256");
    hasher.update(b);
    const hash = hasher.digest("hex");

    const existing = blobStore.get(hash);
    if (existing) {
        return { tag, blob: existing, length: originalLength };
    } else {
        const blob = { offset: 0, content: b, checksum: calculateChecksum(b) };
        blobStore.set(hash, blob);
        return { tag, blob, length: originalLength };
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
