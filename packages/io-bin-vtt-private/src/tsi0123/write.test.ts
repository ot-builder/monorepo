import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ComponentFlag } from "@ot-builder/io-bin-ttf";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { TSI0123 } from "@ot-builder/ot-vtt-private";

import { VttExtraInfoSinkImpl } from "../extra-info-source";

import { readTSI0123 } from "./read";
import { NopProcessor, TSI01Processor, writeTSI0123 } from "./write";

test("TSI0 TSI1 write simple", function () {
    const gOrd = OtListGlyphStoreFactory.createStoreFromSize(4).decideOrder();
    const tsi01 = new TSI0123.Table();
    tsi01.glyphPrograms.set(gOrd.at(0), "A");
    tsi01.glyphPrograms.set(gOrd.at(1), "B");
    tsi01.preProgram = "PREP";
    tsi01.cvtProgram = "CVT";
    tsi01.fpgmProgram = "FPGM";

    const frTSI0 = new Frag();
    const frTSI1 = new Frag();
    writeTSI0123(frTSI0, frTSI1, tsi01, gOrd, new NopProcessor());

    const bvTSI0 = new BinaryView(Frag.pack(frTSI0));
    const bvTSI1 = new BinaryView(Frag.pack(frTSI1));

    const tsi01AfterLoop = readTSI0123(bvTSI0, bvTSI1, gOrd);
    expect(tsi01AfterLoop.glyphPrograms.get(gOrd.at(0))).toBe("A");
    expect(tsi01AfterLoop.glyphPrograms.get(gOrd.at(1))).toBe("B");
    expect(tsi01AfterLoop.preProgram).toBe("PREP");
    expect(tsi01AfterLoop.cvtProgram).toBe("CVT");
    expect(tsi01AfterLoop.fpgmProgram).toBe("FPGM");
});

test("TSI0 TSI1 Pseudo Instruction", function () {
    const gOrd = OtListGlyphStoreFactory.createStoreFromSize(8).decideOrder();
    const eis = new VttExtraInfoSinkImpl();
    eis.setComponentInfo(
        0,
        0,
        ComponentFlag.ARGS_ARE_XY_VALUES |
            ComponentFlag.USE_MY_METRICS |
            ComponentFlag.ROUND_XY_TO_GRID,
        1,
        1,
        2,
        1,
        0,
        0,
        1
    );
    eis.setComponentInfo(0, 1, ComponentFlag.ARGS_ARE_XY_VALUES, 2, 2, 3, 1, 0, 0, 1);
    eis.setComponentInfo(
        0,
        2,
        ComponentFlag.ARGS_ARE_XY_VALUES | ComponentFlag.WE_HAVE_A_SCALE,
        3,
        3,
        4,
        2,
        0,
        0,
        2
    );
    eis.setComponentInfo(0, 3, ComponentFlag.WE_HAVE_A_TWO_BY_TWO, 4, 254, -435, 2, 0.5, 0.5, 2);

    const tsi01 = new TSI0123.Table();
    tsi01.glyphPrograms.set(
        gOrd.at(0),
        "OVERLAP[]\rUSEMYMETRICS[]\rOFFSET[R], 1, 1, 2\r" +
            "OVERLAP[]\rOFFSET[r], 2, 2, 3\r\r" +
            "Body"
    );

    const frTSI0 = new Frag();
    const frTSI1 = new Frag();
    writeTSI0123(frTSI0, frTSI1, tsi01, gOrd, new TSI01Processor(eis));

    const bvTSI0 = new BinaryView(Frag.pack(frTSI0));
    const bvTSI1 = new BinaryView(Frag.pack(frTSI1));

    const tsi01AfterLoop = readTSI0123(bvTSI0, bvTSI1, gOrd);
    expect(tsi01AfterLoop.glyphPrograms.get(gOrd.at(0))).toBe(
        "USEMYMETRICS[]\rOVERLAP[]\rOFFSET[R], 1, 1, 2\r" +
            "OVERLAP[]\rOFFSET[r], 2, 2, 3\r" +
            "OVERLAP[]\rSOFFSET[r], 3, 3, 4, 2.0000, 0.0000, 0.0000, 2.0000\r" +
            "OVERLAP[]\rSANCHOR[r], 4, 254, -435, 2.0000, 0.5000, 0.5000, 2.0000\r\r" +
            "Body"
    );
});
