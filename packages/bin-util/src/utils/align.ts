import { BufferWriter } from "../handlers/buffer-writer";

export function alignBufferSize(buf: Buffer, packing: number) {
    if (packing <= 1) return buf;
    const bw = new BufferWriter();
    bw.bytes(buf);
    while (bw.length % packing) bw.uint8(0);
    return bw.toBuffer();
}
