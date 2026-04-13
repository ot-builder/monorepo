import { CffWriteContext } from "../../../context/write";
import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCallRaw } from "../draw-call";
import { TestRawDcOptimize } from "../test-util";

import { RLineToHVLine } from "./hv-lineto";

test("Draw call optimization: HV-lineto", () => {
    const ctx = new CffWriteContext(2, 1000);
    TestRawDcOptimize(
        ctx,
        [new RLineToHVLine(ctx)],
        [
            new CffDrawCallRaw([1, 0], CharStringOperator.RLineTo),
            new CffDrawCallRaw([0, 0], CharStringOperator.RLineTo),
            new CffDrawCallRaw([2, 0], CharStringOperator.RLineTo),
            new CffDrawCallRaw([0, 3], CharStringOperator.RLineTo),
            new CffDrawCallRaw([1, 1], CharStringOperator.RLineTo),
            new CffDrawCallRaw([0, 1], CharStringOperator.RLineTo),
            new CffDrawCallRaw([0, 0], CharStringOperator.RLineTo),
            new CffDrawCallRaw([0, 2], CharStringOperator.RLineTo),
            new CffDrawCallRaw([3, 0], CharStringOperator.RLineTo)
        ],
        `
        1 0 2 3 HLineTo
        1 1 RLineTo
        1 0 2 3 VLineTo
        `
    );
});
