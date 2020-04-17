import { TestFont } from "@ot-builder/test-util";

import { readSfntBuf } from "./read";

test("SFNT reading", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntBuf(bufFont);

    expect(sfnt.version).toBe(0x10000);
    const glyf = sfnt.tables.get("glyf")!;
    expect(glyf).toBeTruthy();
    expect(glyf.byteLength).toBe(100054);
});
