import { BinaryView } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Avar, Fvar } from "@ot-builder/ot-metadata";
import { TestFont } from "@ot-builder/test-util";

import { FvarIo } from "../fvar";

import { AvarIo } from ".";

test("Reading : AVAR", () => {
    const bufFont = TestFont.get("AdobeVFPrototype.ttf");
    const sfnt = readSfntOtf(bufFont);
    const fvar = new BinaryView(sfnt.tables.get(Fvar.Tag)!).next(FvarIo);
    const avar = new BinaryView(sfnt.tables.get(Avar.Tag)!).next(AvarIo, fvar.getDesignSpace());
    const [wght, cntr] = fvar.axes;
    expect(avar.segmentMaps.get(wght.dim)).toEqual([
        [-1, -1],
        [-7731 / 16384, -4853 / 8192],
        [0, 0],
        [171 / 8192, 337 / 8192],
        [6759 / 16384, 3007 / 8192],
        [9967 / 16384, 11821 / 16384],
        [1, 1]
    ]);
    expect(avar.segmentMaps.get(cntr.dim)).toEqual([
        [-1, -1],
        [0, 0],
        [1, 1]
    ]);
});
