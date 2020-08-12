import { VarianceDim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";
import { VariableCreator, VariableOps } from "../interface/value";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValue, OtVarValueC } from "./value";

export class OtVarValueFactory implements VariableCreator<VarianceDim, OtVarMaster, OtVarValue> {
    constructor(public readonly masterSet: OtVarMasterSet = new OtVarMasterSet()) {}
    public create(origin: number = 0, variance: Iterable<[OtVarMaster, number]> = []) {
        if (!variance) return origin;
        return OtVarValueC.Create(this.masterSet, origin, variance);
    }
    public make(...xs: (OtVarValue | [OtVarMaster, number])[]) {
        let v: OtVarValue = OtVarOps.neutral;
        for (const x of xs) {
            if (Array.isArray(x)) v = OtVarOps.add(v, this.create(0, [x]));
            else v = OtVarOps.add(v, x);
        }
        return v;
    }
}

class OrVarOpsImpl implements VariableOps<VarianceDim, OtVarMaster, OtVarValue> {
    protected scaleAdd(sa: number, a: OtVarValue, sb: number, b: OtVarValue) {
        if (typeof a === "number") {
            if (typeof b === "number") {
                return sa * a + sb * b;
            } else {
                return b.scaleAddNumber(sb, sa * a);
            }
        } else {
            if (typeof b === "number") {
                return a.scaleAddNumber(sa, sb * b);
            } else {
                return a.scaleAddScaleVariable(sa, sb, b);
            }
        }
    }

    public readonly neutral = 0;
    public add(a: OtVarValue, b: OtVarValue) {
        return this.scaleAdd(1, a, 1, b);
    }
    public minus(a: OtVarValue, b: OtVarValue) {
        return this.scaleAdd(1, a, -1, b);
    }
    public negate(a: OtVarValue) {
        return this.scaleAdd(-1, a, 1, 0);
    }
    public scale(s: number, a: OtVarValue) {
        return this.scaleAdd(s, a, 1, 0);
    }
    public addScale(a: OtVarValue, s: number, b: OtVarValue) {
        return this.scaleAdd(1, a, s, b);
    }

    public originOf(a: OtVarValue): number {
        if (typeof a === "number") return a;
        else return a.origin;
    }
    public varianceDeltaOf(a: OtVarValue, m: OtVarMaster) {
        if (typeof a === "number") return 0;
        else return a.getDelta(m);
    }
    public varianceOf(a: OtVarValue): Iterable<[OtVarMaster, number]> {
        if (typeof a === "number") return [];
        else return a.variance();
    }
    public removeOrigin(a: OtVarValue): OtVarValue {
        return this.minus(a, this.originOf(a));
    }
    public evaluate(a: OtVarValue, instance: VarianceInstance<VarianceDim>) {
        if (typeof a === "number") return a;
        else return a.evaluate(instance);
    }
    public equal(a: OtVarValue, b: OtVarValue, err: number = 1) {
        if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= err;
        if (Math.abs(this.evaluate(a, null) - this.evaluate(b, null)) > err) return false;
        for (const [m, delta] of [...this.varianceOf(a), ...this.varianceOf(b)]) {
            const peak = m.getPeak();
            if (Math.abs(this.evaluate(a, peak) - this.evaluate(b, peak)) > err) {
                return false;
            }
        }
        return true;
    }
    public sum(...xs: OtVarValue[]) {
        let s: OtVarValue = 0;
        for (const x of xs) s = this.add(s, x);
        return s;
    }
    public isConstant(x: OtVarValue) {
        if (typeof x === "number") return true;
        return this.equal(x, this.originOf(x), 1 / 0x10000);
    }
    public isZero(x: OtVarValue) {
        return this.isConstant(x) && this.originOf(x) === 0;
    }

    public Creator(ms?: OtVarMasterSet) {
        return new OtVarValueFactory(ms || new OtVarMasterSet());
    }
}

export const OtVarOps: VariableOps<VarianceDim, OtVarMaster, OtVarValue> = new OrVarOpsImpl();
