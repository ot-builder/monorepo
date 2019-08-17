import { BinaryView, Frag } from "@ot-builder/bin-util";

import { Tag } from "./tag";

test("Tag roundtrip", () => {
    for (const str of ["abcd", "ABCD", "a"]) {
        const frag = new Frag();
        frag.push(Tag, str);
        const view = new BinaryView(Frag.pack(frag));
        const str1 = view.next(Tag);
        expect(str).toBe(str1.slice(0, str.length));
        expect(str1).toBe((str + " ".repeat(8)).slice(0, 4));
    }
});
