import { BinaryView, Frag } from "@ot-builder/bin-util";

import { F16D16, F2D14, Int16, Int32, Int8, UInt16, UInt32, UInt8 } from "./fixed";

test("Fixed number roundtrip (Int16)", () => {
    for (const v of [-0x8000, -1, 0, 1, 0x7fff]) {
        const frag = new Frag();
        frag.push(F16D16, v);
        const view = new BinaryView(Frag.pack(frag));
        const v1 = view.next(F16D16);
        expect(v).toBe(v1);
    }
});
test("Fixed number roundtrip (F16D16)", () => {
    const cases = [
        -16637 + 1444 / 0x10000,
        -0x8000,
        -0x8000 + 1 / 0x10000,
        -1,
        -1 / 0x10000,
        0,
        1 / 0x10000,
        1,
        0x7fff - 1 / 0x10000,
        0x7fff,
        1 / 4
    ];
    for (const v of cases) {
        const frag = new Frag();
        frag.push(F16D16, v);
        const view = new BinaryView(Frag.pack(frag));
        const v1 = view.next(F16D16);
        expect(v).toBe(v1);
    }
});
test("Fixed number roundtrip (F2D14)", () => {
    const cases = [
        -1 + 1453 / 0x4000,
        -2,
        -1 + 1 / 0x4000,
        -1 - 1 / 0x4000,
        -1,
        -1 + 1 / 0x4000,
        -1 / 0x4000,
        0,
        +1 / 0x4000,
        1 / 4,
        1 - 1 / 0x4000,
        1,
        1 + 1 / 0x4000,
        2 - 1 / 0x4000
    ];
    for (const v of cases) {
        const frag = new Frag();
        const hole = frag.reserve(F2D14);
        hole.fill(v);
        frag.push(F2D14, v);
        const view = new BinaryView(Frag.pack(frag));
        const v1 = view.next(F2D14);
        const v2 = view.next(F2D14);
        expect(v).toBe(v1);
        expect(v).toBe(v2);
    }
});
test("Fixed number should have correct range", () => {
    expect(UInt32.max).toBe(0xffffffff);
    expect(UInt32.min).toBe(0x0);
    expect(Int32.max).toBe(0x7fffffff);
    expect(Int32.min).toBe(-0x80000000);
    expect(UInt16.max).toBe(0xffff);
    expect(UInt16.min).toBe(0x0);
    expect(Int16.max).toBe(0x7fff);
    expect(Int16.min).toBe(-0x8000);
    expect(UInt8.max).toBe(0xff);
    expect(UInt8.min).toBe(0x0);
    expect(Int8.max).toBe(0x7f);
    expect(Int8.min).toBe(-0x80);
});
