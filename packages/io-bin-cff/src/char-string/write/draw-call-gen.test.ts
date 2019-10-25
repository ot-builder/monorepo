import { OtGlyph } from "@ot-builder/ft-glyphs";

import { CffWriteContext } from "../../context/write";

import { CffDrawCall } from "./draw-call";
import { codeGenGlyph } from "./draw-call-gen";
import { Mir } from "./mir";

test("Draw call generator test", () => {
    const ctx = new CffWriteContext(2, 1000);
    const glyph = new OtGlyph();
    const hints = new OtGlyph.CffHint();
    hints.hStems = [new OtGlyph.CffHintStem(1, 2), new OtGlyph.CffHintStem(3, 4)];
    hints.hintMasks = [
        new OtGlyph.CffHintMask(
            { geometry: 0, contour: 0, index: 0 },
            new Set([hints.hStems[0]]),
            new Set()
        ),
        new OtGlyph.CffHintMask(
            { geometry: 0, contour: 0, index: 1 },
            new Set([hints.hStems[1]]),
            new Set()
        ),
        new OtGlyph.CffHintMask(
            { geometry: 0, contour: 1, index: 0 },
            new Set([hints.hStems[0]]),
            new Set()
        ),
        new OtGlyph.CffHintMask(
            { geometry: 1, contour: 0, index: 0 },
            new Set([hints.hStems[0], hints.hStems[1]]),
            new Set()
        )
    ];
    glyph.hints = hints;

    glyph.geometry = new OtGlyph.ContourSet([
        [
            new OtGlyph.Point(1, 1, OtGlyph.PointType.Corner),
            new OtGlyph.Point(2, 1, OtGlyph.PointType.Corner),
            new OtGlyph.Point(2, 2, OtGlyph.PointType.Corner),
            new OtGlyph.Point(1, 2, OtGlyph.PointType.Corner)
        ],
        [
            new OtGlyph.Point(10, 10, OtGlyph.PointType.Corner),
            new OtGlyph.Point(20, 10, OtGlyph.PointType.Corner),
            new OtGlyph.Point(20, 20, OtGlyph.PointType.Lead),
            new OtGlyph.Point(10, 20, OtGlyph.PointType.Follow)
        ]
    ]);

    const drawCalls = codeGenGlyph(ctx, 0, glyph);
    const mirSeq = CffDrawCall.charStringSeqToMir(ctx, drawCalls);
    expect(Mir.rectifyMirStr(Mir.printCharString(mirSeq))).toBe(
        Mir.rectifyMirStr(`
    1 1 1 1 HStemHM
    HintMask[1 0]
    1 1 RMoveTo
    HintMask[0 1]
    1 0 RLineTo
    0 1 RLineTo
    -1 0 RLineTo
    0 -1 RLineTo
    HintMask[1 0]
    9 9 RMoveTo
    10 0 RLineTo
    0 10 -10 0 0 -10 RRCurveTo
    HintMask[1 1]
`)
    );
});
