import { BinaryView, Frag } from "@ot-builder/bin-util";
import { TestFont } from "@ot-builder/test-util";

import { SfntRead } from "./read";
import { SfntWrite } from "./write";

test("SFNT writing", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");

    const view = new BinaryView(bufFont);
    const sfnt = view.next(SfntRead);

    const frag = new Frag();
    frag.push(SfntWrite, sfnt);

    const view2 = new BinaryView(Frag.pack(frag));
    const sfnt2 = view2.next(SfntRead);

    for (const [tag, table] of sfnt.tables) {
        if (tag === "head") continue;
        expect(0).toBe(table.compare(sfnt2.tables.get(tag)!));
    }
});
