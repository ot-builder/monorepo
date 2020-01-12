import { BinaryView, Frag } from "@ot-builder/bin-util";

import { GidCoverage } from "./coverage";

describe("Coverage IO", () => {
    function generateRandomList(maxLen: number) {
        const n = Math.max(1, Math.round(maxLen / 4 + (Math.random() * maxLen) / 4));
        const s = new Set<number>();
        while (s.size < n) {
            const a = (Math.random() * 0xffff) | 0;
            s.add(a);
        }
        return [...s].sort((a, b) => a - b);
    }

    test("Coverage IO should work", () => {
        let len = 1;
        for (let pass = 0; pass < 0x4000; pass++) {
            const list = generateRandomList(len);
            const frag = Frag.from(GidCoverage, list);
            const view = new BinaryView(Frag.pack(frag));
            const list1 = view.next(GidCoverage);
            expect(list1).toEqual(list);
            len = (len * 2) & 0x7fff;
        }
    });
});
