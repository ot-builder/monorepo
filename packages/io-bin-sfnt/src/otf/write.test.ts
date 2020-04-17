import { TestFont } from "@ot-builder/test-util";

import { readSfntBuf } from "./read";
import { writeSfntBuf } from "./write";

test("SFNT writing", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntBuf(bufFont);
    const bufWritten = writeSfntBuf(sfnt);
    const sfnt2 = readSfntBuf(bufWritten);

    for (const [tag, table] of sfnt.tables) {
        if (tag === "head") continue;
        expect(0).toBe(table.compare(sfnt2.tables.get(tag)!));
    }
});
