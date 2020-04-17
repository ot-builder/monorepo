import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readSfntBuf } from "@ot-builder/io-bin-sfnt";
import { Name } from "@ot-builder/ot-name";
import { TestFont } from "@ot-builder/test-util";

import { NameIo } from "./index";

test("Read-write roundtrip : name", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = readSfntBuf(bufFont);
    const name = new BinaryView(sfnt.tables.get(Name.Tag)!).next(NameIo);
    const nameBuf1 = Frag.packFrom(NameIo, name);
    const name2 = new BinaryView(nameBuf1).next(NameIo);
    expect(name).toEqual(name2);
});
