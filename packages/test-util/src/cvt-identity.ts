import { Cvt } from "@ot-builder/ot-glyphs";

import { EmptyCtx, StdCompare } from "./compar-util";
import * as FastMatch from "./fast-match";

function test0(ctx: EmptyCtx, expected: Cvt.Table, actual: Cvt.Table) {
    expect(expected.items.length).toBe(actual.items.length);
    for (let cvtId = 0; cvtId < expected.items.length; cvtId++) {
        FastMatch.otvar(expected.items[cvtId], actual.items[cvtId], "#" + cvtId);
    }
}

export const test = StdCompare(test0);
