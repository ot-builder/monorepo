import { BinaryView, Frag } from "@ot-builder/bin-util";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Maxp } from "@ot-builder/ot-metadata";
import { TestFont } from "@ot-builder/test-util";

import { MaxpIo } from "./index";

test("Read-write roundtrip : maxp - ttf", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const maxp = new BinaryView(sfnt.tables.get(Maxp.Tag)!).next(MaxpIo);
    const fr = new Frag().push(MaxpIo, maxp);
    const maxp2 = new BinaryView(Frag.pack(fr)).next(MaxpIo);

    expect(maxp).toEqual(maxp2);
});

test("Read-write roundtrip : maxp - cff", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.otf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const maxp = new BinaryView(sfnt.tables.get(Maxp.Tag)!).next(MaxpIo);
    const fr = new Frag().push(MaxpIo, maxp);
    expect(fr.size).toBe(6);

    const maxp2 = new BinaryView(Frag.pack(fr)).next(MaxpIo);
    expect(maxp).toEqual(maxp2);
});
