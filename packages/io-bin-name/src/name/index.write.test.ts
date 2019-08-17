import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Name } from "@ot-builder/ft-name";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { NameIo } from ".";

test("Read-write roundtrip : name", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const name = new BinaryView(sfnt.tables.get(Name.Tag)!).next(NameIo);
    const nameBuf1 = Frag.packFrom(NameIo, name);
    const name2 = new BinaryView(nameBuf1).next(NameIo);
    expect(name).toEqual(name2);
});
