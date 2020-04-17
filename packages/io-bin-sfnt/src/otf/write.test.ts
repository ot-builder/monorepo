import { TestFont } from "@ot-builder/test-util";

import { readSfntOtf } from "./read";
import { writeSfntOtf } from "./write";

test("SFNT writing", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntOtf(bufFont);
    const bufWritten = writeSfntOtf(sfnt);
    const sfnt2 = readSfntOtf(bufWritten);

    for (const [tag, table] of sfnt.tables) {
        if (tag === "head") continue;
        expect(0).toBe(table.compare(sfnt2.tables.get(tag)!));
    }
});
