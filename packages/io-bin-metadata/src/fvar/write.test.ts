import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Fvar } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from ".";

test("Read-write roundtrip : FVAR", () => {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    const fr = new Frag().push(FvarIo, fvar);
    const fvar1 = new BinaryView(Frag.pack(fr)).next(FvarIo);

    expect(fvar.axes).toEqual(fvar1.axes);
    expect(fvar.instances).toEqual(fvar1.instances);
});
