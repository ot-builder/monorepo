import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { ImpLib } from "@ot-builder/common-impl";
import { Cvt } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { CvtIdentity, EmptyCtx, TestFont } from "@ot-builder/test-util";

import { CvtIo } from "../cvt/index";

import { CvarIo } from "./index";

function cvtRoundTipLoop(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ fontMetadata: {} });
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const axes = fvar ? ImpLib.Order.fromList("Axes", fvar.axes) : null;

    const cvt = new BinaryView(sfnt.tables.get(Cvt.Tag)!).next(CvtIo);
    if (axes) {
        const bCvar = sfnt.tables.get(Cvt.TagVar);
        if (bCvar) new BinaryView(bCvar).next(CvarIo, cvt, axes);
    }
    const cvtBuf = Frag.packFrom(CvtIo, cvt);

    let cvarBuf = null;
    if (axes) {
        const sfEmpty = new ImpLib.State<boolean>(false);
        cvarBuf = Frag.packFrom(CvarIo, cvt, axes, sfEmpty);
        if (sfEmpty.get()) cvarBuf = null;
    }

    const cvt2 = new BinaryView(cvtBuf).next(CvtIo);
    if (axes && cvarBuf) {
        new BinaryView(cvarBuf).next(CvarIo, cvt2, axes);
    }
    CvtIdentity.test(EmptyCtx.create(), cvt, cvt2);
}

test("CVT roundtrip, Scheherazade-Regular.ttf", () => {
    cvtRoundTipLoop("Scheherazade-Regular.ttf");
});
test("CVT roundtrip, Scheherazade-Bold.ttf", () => {
    cvtRoundTipLoop("Scheherazade-Bold.ttf");
});
test("CVT roundtrip, TestCVARGVAROne.ttf", () => {
    cvtRoundTipLoop("TestCVARGVAROne.ttf");
});
test("CVT roundtrip, TestCVARGVARTwo.ttf", () => {
    cvtRoundTipLoop("TestCVARGVARTwo.ttf");
});
