import { BinaryView } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Avar, Fvar } from "@ot-builder/ft-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from "../fvar";

import { AvarIo } from ".";

test("Reading : AVAR", () => {
    const bufFont = TestFont.get("AdobeVFPrototype.ttf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    const avar = new BinaryView(sfnt.tables.get(Avar.Tag)!).next(
        AvarIo,
        ImpLib.Order.fromList(`Axes`, fvar.axes)
    );
    const [wght, cntr] = fvar.axes;
    expect(avar.segmentMaps.get(wght)).toEqual([
        [-1, -1],
        [-7731 / 16384, -4853 / 8192],
        [0, 0],
        [171 / 8192, 337 / 8192],
        [6759 / 16384, 3007 / 8192],
        [9967 / 16384, 11821 / 16384],
        [1, 1]
    ]);
    expect(avar.segmentMaps.get(cntr)).toEqual([
        [-1, -1],
        [0, 0],
        [1, 1]
    ]);
});
