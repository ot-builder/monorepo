import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Cvt } from "@ot-builder/ot-glyphs";
import { CvtIdentity, EmptyCtx, TestFont } from "@ot-builder/test-util";

import { CvtIo } from "../cvt/index";

import { CvarIo } from "./index";

function cvtRoundTipLoop(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { fontMetadata: {} };
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const designSpace = fvar ? fvar.getDesignSpace() : null;

    const cvt = new BinaryView(sfnt.tables.get(Cvt.Tag)!).next(CvtIo);
    if (designSpace) {
        const bCvar = sfnt.tables.get(Cvt.TagVar);
        if (bCvar) new BinaryView(bCvar).next(CvarIo, cvt, designSpace);
    }
    const cvtBuf = Frag.packFrom(CvtIo, cvt);

    let cvarBuf = null;
    if (designSpace) {
        const sfEmpty = new ImpLib.State<boolean>(false);
        cvarBuf = Frag.packFrom(CvarIo, cvt, designSpace, sfEmpty);
        if (sfEmpty.get()) cvarBuf = null;
    }

    const cvt2 = new BinaryView(cvtBuf).next(CvtIo);
    if (designSpace && cvarBuf) {
        new BinaryView(cvarBuf).next(CvarIo, cvt2, designSpace);
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
