import { CffWriteContext } from "../../../context/write";
import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCallRaw } from "../draw-call";
import { TestRawDcOptimize } from "../test-util";

import { RRCurveToHVVHCurve } from "./hvvh-curveto";

test("Draw call optimization: HV-VH-curveto", () => {
    const ctx = new CffWriteContext(2, 1000);
    TestRawDcOptimize(
        ctx,
        [new RRCurveToHVVHCurve(ctx)],
        [
            new CffDrawCallRaw([1, 0, 1, 1, 0, 1], CharStringOperator.RRCurveTo),
            new CffDrawCallRaw([0, 2, 2, 2, 2, 0], CharStringOperator.RRCurveTo),
            new CffDrawCallRaw([0, 2, 2, 2, 2, 0], CharStringOperator.RRCurveTo),
            new CffDrawCallRaw([3, 0, 3, 3, 4, 3], CharStringOperator.RRCurveTo),
            new CffDrawCallRaw([0, 5, 5, 5, 5, 0], CharStringOperator.RRCurveTo)
        ],
        `
        1 1 1 1 2 2 2 2 HVCurveTo
        2 2 2 2 3 3 3 3 4 VHCurveTo
        5 5 5 5 VHCurveTo
        `
    );
});
