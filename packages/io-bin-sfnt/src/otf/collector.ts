import { BufferWriter } from "@ot-builder/bin-util";
import { Tag, UInt32 } from "@ot-builder/primitive";
import * as crypto from "crypto";

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
    const bw = new BufferWriter();
    bw.bytes(buf);
    while (bw.length % 4) bw.uint8(0);
    const b = bw.toBuffer();

    const hasher = crypto.createHash("sha256");
    hasher.update(b);
    const hash = hasher.digest("hex");

    const existing = blobStore.get(hash);
    if (existing) {
        return { tag, blob: existing, length: originalLength };
    } else {
        const blob = { offset: 0, content: bw.toBuffer(), checksum: calculateChecksum(b) };
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
