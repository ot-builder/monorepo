import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCall } from "../draw-call";

import { argIsZero, DrawCallOptimizationPass } from "./general";

export class RRCurveToHHVVCurve extends DrawCallOptimizationPass<CffDrawCall> {
    protected *doFlush(st: CffDrawCall) {
        yield st;
    }

    private fetchIncomingArgOp(dc: CffDrawCall) {
        const [dx1, dy1, dx2, dy2, dx3, dy3] = dc.args;
        if (dc.operator !== CharStringOperator.RRCurveTo) return null;

        if (argIsZero(dx1) && argIsZero(dy3)) {
            return {
                op: CharStringOperator.VVCurveTo,
                args: [dy1, dx2, dy2, dy3]
            };
        } else if (argIsZero(dy1) && argIsZero(dy3)) {
            return {
                op: CharStringOperator.HHCurveTo,
                args: [dx1, dx2, dy2, dx3]
            };
        } else {
            return null;
        }
    }

    protected tryUpdateState(st: CffDrawCall, dc: CffDrawCall) {
        const iao = this.fetchIncomingArgOp(dc);
        if (!iao) return null;

        const limits = this.ctx.getLimits();

        const canMerge = iao.op === st.operator;
        if (canMerge) {
            const merged = new CffDrawCall(st.ivd, [...st.args, ...iao.args], st.operator);
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
        const iao = this.fetchIncomingArgOp(dc);
        if (!iao) return null;
        else return new CffDrawCall(dc.ivd, iao.args, iao.op);
    }
}
