import { Frag, FragPointerEmbedding } from "./fragment";

test("Frag: Plain Serialize", () => {
    const root = new Frag().uint16(1).uint32(0x01020304);
    expect([...Frag.pack(root)]).toEqual([0, 1, 1, 2, 3, 4]);
});

test("Frag: Shared Pointer", () => {
    const a = Frag.ptr16(Frag.uint32(0x01020304));
    const root = Frag.ptr16(a).ptr16(Frag.uint32(0x01020304));
    expect([...Frag.pack(root)]).toEqual([...[0, 4, 0, 6], ...[0, 2], ...[1, 2, 3, 4]]);
});

test("Frag: Shared Embed-relative Pointer", () => {
    const a = Frag.ptr16(Frag.uint32(0x01020304));
    const b = Frag.ptr16(a, FragPointerEmbedding.EmbedRelative).ptr16(
        Frag.uint32(0x01020304),
        FragPointerEmbedding.EmbedRelative
    );
    const root = Frag.ptr16(a).ptr16(Frag.uint32(0x01020304)).embed(b);
    expect([...Frag.pack(root)]).toEqual([
        ...[0, 8, 0, 10, 0, 4, 0, 6],
        ...[0, 2],
        ...[1, 2, 3, 4]
    ]);
});

test("Frag: Absolute pointers", () => {
    const a = Frag.ptr16(Frag.uint32(0x01020304), FragPointerEmbedding.Absolute);
    const root = Frag.ptr16(a).ptr16(Frag.uint32(0x01020304), FragPointerEmbedding.Absolute);
    expect([...Frag.pack(root)]).toEqual([0, 4, 0, 6, 0, 6, 1, 2, 3, 4]);
});

test("Frag: de-overflow", () => {
    // Build a frag graph that has a very long pointer
    const a = Frag.uint16(1);
    const big = new Frag();
    const big2 = new Frag();
    while (big.size < 0x8000) big.uint8(0);
    while (big2.size < 0x8000) big2.uint8(0);
    big.ptr16(big2);
    big2.ptr16(a);
    const root = Frag.ptr16(a.clone()).ptr16(big);

    // This graph is solvable, with final length being 65548 bytes
    expect(65548).toBe([...Frag.pack(root)].length);
});

test("Frag: complex sharing patterns", () => {
    const root = Frag.ptr16(Frag.uint16(9).uint16(9))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(33)).ptr16(Frag.uint8(0x33).uint8(0x44)))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(44)).ptr16(Frag.uint8(0x33).uint8(0x44)))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(55)).ptr16(Frag.uint8(0x33).uint8(0x44)))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(66)).ptr16(Frag.uint8(0x33).uint8(0x44)))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(22)).ptr32(Frag.uint8(0x33).uint8(0x44)))
        .ptr16(Frag.ptr16(Frag.uint8(11).uint8(22)).ptr16(Frag.uint8(0x33).uint8(0x44)));

    const rootValue: number[] = [
        ...[0, 14, 0, 18, 0, 24, 0, 30, 0, 36, 0, 42, 0, 48],
        ...[0, 9, 0, 9],
        ...[0, 4, 0, 36],
        ...[11, 33],
        ...[0, 4, 0, 30],
        ...[11, 44],
        ...[0, 4, 0, 24],
        ...[11, 55],
        ...[0, 4, 0, 18],
        ...[11, 66],
        ...[0, 10, 0, 0, 0, 12],
        ...[0, 4, 0, 6],
        ...[11, 22],
        ...[51, 68]
    ];
    expect([...Frag.pack(root)]).toEqual(rootValue);
});

test("Frag: multi-root packing", () => {
    const a = Frag.ptr16(Frag.uint32(0x01020304));
    const a2 = Frag.ptr16(Frag.uint32(0x01020304));
    const b = Frag.ptr16(a).ptr32(Frag.uint32(0x01020304));
    const results = Frag.packMany([a, a2, b]);
    expect([...results.buffer]).toEqual([0, 6, 0, 0, 0, 8, 0, 2, 1, 2, 3, 4]);
    expect([...results.rootOffsets]).toEqual([6, 6, 0]);
});
