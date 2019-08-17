import { VsEncodingMapImplT } from "./vs-encoding-map-impl";

describe("VS encoding map", () => {
    test("Should work", () => {
        const vsm = new VsEncodingMapImplT<number>();
        vsm.set(0, 0, 0);
        vsm.set(0, 0xffffff, 1);
        vsm.set(0xffffff, 0, 2);
        vsm.set(0xffffff, 0xffffff, 3);
        expect(vsm.get(0, 0)).toBe(0);
        expect(vsm.get(0, 0xffffff)).toBe(1);
        expect(vsm.get(0xffffff, 0)).toBe(2);
        expect(vsm.get(0xffffff, 0xffffff)).toBe(3);
    });
});
