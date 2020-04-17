import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readSfntBuf } from "@ot-builder/io-bin-sfnt";
import { Cvt } from "@ot-builder/ot-glyphs";
import { CvtIdentity, EmptyCtx, TestFont } from "@ot-builder/test-util";

import { CvtIo } from "./index";

function cvtRoundTipLoop(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntBuf(bufFont);
    const cvt = new BinaryView(sfnt.tables.get(Cvt.Tag)!).next(CvtIo);
    const cvtBuf = Frag.packFrom(CvtIo, cvt);
    const cvt2 = new BinaryView(cvtBuf).next(CvtIo);
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
