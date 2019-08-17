import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCall } from "../draw-call";

import { argIsZero, DrawCallOptimizationPass } from "./general";

export class RRCurveToHVVHCurve extends DrawCallOptimizationPass<CffDrawCall> {
    protected *doFlush(st: CffDrawCall) {
        yield st;
    }

    private fetchIncomingArgOp(dc: CffDrawCall) {
        const [dx1, dy1, dx2, dy2, dx3, dy3] = dc.args;
        if (dc.operator !== CharStringOperator.RRCurveTo) return null;

        if (argIsZero(dx1)) {
            return {
                op: CharStringOperator.VHCurveTo,
                args: [dy1, dx2, dy2, dx3, ...(argIsZero(dy3) ? [] : [dy3])]
            };
        } else if (argIsZero(dy1)) {
            return {
                op: CharStringOperator.HVCurveTo,
                args: [dx1, dx2, dy2, dy3, ...(argIsZero(dx3) ? [] : [dx3])]
            };
        } else {
            return null;
        }
    }

    protected tryUpdateState(st: CffDrawCall, dc: CffDrawCall) {
        const iao = this.fetchIncomingArgOp(dc);
        if (!iao) return null;

        const lastIsY = (st.operator === CharStringOperator.HVCurveTo) === st.args.length % 8 >= 4;
        const lastTangentIsDiagonal = st.args.length % 2;
        if (lastTangentIsDiagonal) return null;

        const limits = this.ctx.getLimits();

        const canMerge = lastIsY !== (iao.op === CharStringOperator.HVCurveTo);
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
