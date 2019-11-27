import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Avar, Fvar } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from "../fvar";

import { AvarIo } from ".";

function AvarRoundtrip(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    const axes = ImpLib.Order.fromList(`Axes`, fvar.axes);

    const avar = new BinaryView(sfnt.tables.get(Avar.Tag)!).next(AvarIo, axes);
    const bufAvar1 = Frag.packFrom(AvarIo, avar, axes);
    const avar2 = new BinaryView(bufAvar1).next(AvarIo, axes);

    expect(avar2).toEqual(avar);
}

test("Read-write roundtrip : AVAR", () => {
    AvarRoundtrip("AdobeVFPrototype.ttf");
    AvarRoundtrip("SourceSerifVariable-Roman.ttf");
});
