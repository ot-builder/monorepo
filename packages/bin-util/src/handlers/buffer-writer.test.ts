import { BufferWriter } from "./buffer-writer";

test("Buffer writer test", () => {
    const bw = new BufferWriter();
    bw.uint8(1);
    bw.uint16(0x0203);
    bw.uint32(0x04050607);
    expect([1, 2, 3, 4, 5, 6, 7]).toEqual([...bw.toBuffer()]);
});

test("Buffer writer seek test", () => {
    const bw = new BufferWriter();
    bw.uint8(1);
    bw.uint16(0x0203);
    bw.uint32(0x04050607);
    bw.seek(1);
    bw.uint16(0x8899);
    expect([1, 0x88, 0x99, 4, 5, 6, 7]).toEqual([...bw.toBuffer()]);
    bw.seek(10);
    bw.uint8(1);
    expect([1, 0x88, 0x99, 4, 5, 6, 7, 0, 0, 0, 1]).toEqual([...bw.toBuffer()]);
    bw.shrinkToFit();
    expect([1, 0x88, 0x99, 4, 5, 6, 7, 0, 0, 0, 1]).toEqual([...bw.toBuffer()]);
});
