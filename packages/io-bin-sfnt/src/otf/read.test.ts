import { BinaryView } from "@ot-builder/bin-util";
import { TestFont } from "@ot-builder/test-util";

import { SfntRead } from "./read";

test("SFNT reading", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const view = new BinaryView(bufFont);
    const sfnt = view.next(SfntRead);

    expect(sfnt.version).toBe(0x10000);
    const glyf = sfnt.tables.get("glyf")!;
    expect(glyf).toBeTruthy();
    expect(glyf.byteLength).toBe(100054);
});
