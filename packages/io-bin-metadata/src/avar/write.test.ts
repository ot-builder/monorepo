import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Avar, Fvar } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from "../fvar";

import { AvarIo } from "./index";

function AvarRoundtrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    const designSpace = fvar.getDesignSpace();

    const avar = new BinaryView(sfnt.tables.get(Avar.Tag)!).next(AvarIo, designSpace);
    const bufAvar1 = Frag.packFrom(AvarIo, avar, designSpace);
    const avar2 = new BinaryView(bufAvar1).next(AvarIo, designSpace);

    expect(avar2).toEqual(avar);
}

test("Read-write roundtrip : AVAR", () => {
    AvarRoundtrip("AdobeVFPrototype.ttf");
    AvarRoundtrip("SourceSerifVariable-Roman.ttf");
});
