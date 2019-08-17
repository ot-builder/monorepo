import { CharStringOperator } from "../../../interp/operator";
import { CffDrawCall } from "../draw-call";

import { argIsZero, DrawCallOptimizationPass } from "./general";

export class RMoveToHVMove extends DrawCallOptimizationPass<CffDrawCall> {
    protected *doFlush(st: CffDrawCall) {
        yield st;
    }

    protected tryUpdateState(st: CffDrawCall, dc: CffDrawCall) {
        return null;
    }

    protected tryInitState(dc: CffDrawCall) {
        if (dc.operator !== CharStringOperator.RMoveTo) return null;
        if (dc.args.length !== 2) return null;
        const [dx, dy] = dc.args;
        if (argIsZero(dx)) {
            return new CffDrawCall(dc.ivd, [dy], CharStringOperator.VMoveTo);
        } else if (argIsZero(dy)) {
            return new CffDrawCall(dc.ivd, [dx], CharStringOperator.HMoveTo);
        } else {
            return null;
        }
    }
}
export class RMoveToHVMoveW extends DrawCallOptimizationPass<CffDrawCall> {
    protected *doFlush(st: CffDrawCall) {
        yield st;
    }

    protected tryUpdateState(st: CffDrawCall, dc: CffDrawCall) {
        return null;
    }

    protected tryInitState(dc: CffDrawCall) {
        if (dc.operator !== CharStringOperator.RMoveTo) return null;
        if (dc.args.length !== 3) return null;
        const [w, dx, dy] = dc.args;
        if (argIsZero(dx)) {
            return new CffDrawCall(dc.ivd, [w, dy], CharStringOperator.VMoveTo);
        } else if (argIsZero(dy)) {
            return new CffDrawCall(dc.ivd, [w, dx], CharStringOperator.HMoveTo);
        } else {
            return null;
        }
    }
}
