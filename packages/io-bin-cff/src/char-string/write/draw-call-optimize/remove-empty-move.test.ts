import { CffWriteContext } from "../../../context/write";
import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCallRaw } from "../draw-call";
import { TestRawDcOptimize } from "../test-util";

import { RemoveEmptyMove } from "./remove-empty-move";

test("Draw call optimization: empty move removal", () => {
    const ctx = new CffWriteContext(2, 1000);
    const rawDC = [
        new CffDrawCallRaw([1, 1], CharStringOperator.RLineTo),
        new CffDrawCallRaw([0, 0], CharStringOperator.RLineTo),
        new CffDrawCallRaw([0, 1], CharStringOperator.RLineTo)
    ];
    TestRawDcOptimize(
        ctx,
        [new RemoveEmptyMove(ctx)],
        rawDC,
        `
        1 1 RLineTo
        0 1 RLineTo
        `
    );
});
