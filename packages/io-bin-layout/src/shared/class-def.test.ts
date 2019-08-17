import { BinaryView, Frag } from "@ot-builder/bin-util";

import { GidClassDef } from "./class-def";

describe("ClassDef IO", () => {
    function generateRandomList(maxLen: number, maxK: number) {
        let n = Math.max(1, Math.round(maxLen / 4 + (Math.random() * maxLen) / 4));
        let s = new Set<number>();
        let m = new Map<number, number>();
        while (s.size < n) {
            let a = (Math.random() * 0xffff) | 0;
            if (s.has(a)) continue;
            s.add(a);
            m.set(a, (Math.random() * maxK) | 0);
        }
        return [...m].sort((a, b) => a[0] - b[0]);
    }

    test("ClassDef IO should work", () => {
        let len = 1;
        for (let pass = 0; pass < 0x4000; pass++) {
            const list = generateRandomList(len, pass / 4);
            const frag = Frag.from(GidClassDef, list);
            const view = new BinaryView(Frag.pack(frag));
            const list1 = Array.from(view.next(GidClassDef)).sort((a, b) => a[0] - b[0]);
            expect(list1).toEqual(list);
            len = (len * 2) & 0x7fff;
        }
    });
});
