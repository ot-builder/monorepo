import { BinaryView } from "@ot-builder/bin-util";
import { Head } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { HeadIo } from ".";

test("Reading : head", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const head = new BinaryView(sfnt.tables.get(Head.Tag)!).next(HeadIo);
    expect(head.unitsPerEm).toBe(1000);
    expect(head.fontRevision).toBe(3);
});
