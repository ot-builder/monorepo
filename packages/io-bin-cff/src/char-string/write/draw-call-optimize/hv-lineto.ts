import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCall } from "../draw-call";

import { argIsZero, DrawCallOptimizationPass } from "./general";

export class RLineToHVLine extends DrawCallOptimizationPass<CffDrawCall> {
    protected *doFlush(st: CffDrawCall) {
        yield st;
    }

    protected tryUpdateState(st: CffDrawCall, dc: CffDrawCall) {
        if (dc.operator !== CharStringOperator.RLineTo) return null;
        const lastIsY = (st.operator === CharStringOperator.VLineTo) === st.args.length % 2 > 0;
        const [dx, dy] = dc.args;
        const canMerge = (lastIsY && argIsZero(dy)) || (!lastIsY && argIsZero(dx));
        const limits = this.ctx.getLimits();
        if (canMerge) {
            const merged = new CffDrawCall(st.ivd, [...st.args, lastIsY ? dx : dy], st.operator);
            if (merged.stackRidge < limits.maxStack && merged.stackRise < limits.maxStack) {
                return merged;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    protected tryInitState(dc: CffDrawCall) {
        if (dc.operator !== CharStringOperator.RLineTo) return null;
        const [dx, dy] = dc.args;
        if (argIsZero(dx)) {
            return new CffDrawCall(dc.ivd, [dy], CharStringOperator.VLineTo);
        } else if (argIsZero(dy)) {
            return new CffDrawCall(dc.ivd, [dx], CharStringOperator.HLineTo);
        } else {
            return null;
        }
    }
}
