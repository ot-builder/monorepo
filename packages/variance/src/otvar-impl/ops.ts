import { Algebra } from "@ot-builder/prelude";

import { VarianceDim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";
import { VarianceMaster, VarianceMasterSet } from "../interface/master";
import { VariableCreator, VariableOps } from "../interface/value";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValueC } from "./value";

export type OtVarValue<A extends VarianceDim, M extends VarianceMaster<A>> =
    | number
    | OtVarValueC<A, M>;

type MasterSetFactory<
    A extends VarianceDim,
    M extends VarianceMaster<A>
> = () => VarianceMasterSet<A, M>;

export class OtVarCreatorImpl<A extends VarianceDim, M extends VarianceMaster<A>>
    implements VariableCreator<A, M, OtVarValue<A, M>> {
    constructor(
        public readonly masterSet: VarianceMasterSet<A, M>,
        public ops: Algebra.VectorSpace<OtVarValue<A, M>, number>
    ) {}

    public create(origin: number = 0, variance: Iterable<[M, number]> = []) {
        if (!variance) return origin;
        return OtVarValueC.Create(this.masterSet, origin, variance);
    }
    public make(...xs: (OtVarValue<A, M> | [M, number])[]) {
        let v: OtVarValue<A, M> = this.ops.neutral;
        for (const x of xs) {
            if (Array.isArray(x)) v = this.ops.add(v, this.create(0, [x]));
            else v = this.ops.add(v, x);
        }
        return v;
    }
}

class OrVarOpsImpl<A extends VarianceDim, M extends VarianceMaster<A>>
    implements VariableOps<A, M, OtVarValue<A, M>> {
    constructor(private readonly masterSetFactory: MasterSetFactory<A, M>) {}

    protected scaleAdd(sa: number, a: OtVarValue<A, M>, sb: number, b: OtVarValue<A, M>) {
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
    public add(a: OtVarValue<A, M>, b: OtVarValue<A, M>) {
        return this.scaleAdd(1, a, 1, b);
    }
    public minus(a: OtVarValue<A, M>, b: OtVarValue<A, M>) {
        return this.scaleAdd(1, a, -1, b);
    }
    public negate(a: OtVarValue<A, M>) {
        return this.scaleAdd(-1, a, 1, 0);
    }
    public scale(s: number, a: OtVarValue<A, M>) {
        return this.scaleAdd(s, a, 1, 0);
    }
    public addScale(a: OtVarValue<A, M>, s: number, b: OtVarValue<A, M>) {
        return this.scaleAdd(1, a, s, b);
    }

    public originOf(a: OtVarValue<A, M>): number {
        if (typeof a === "number") return a;
        else return a.origin;
    }
    public varianceOf(a: OtVarValue<A, M>): Iterable<[M, number]> {
        if (typeof a === "number") return [];
        else return a.variance();
    }
    public removeOrigin(a: OtVarValue<A, M>): OtVarValue<A, M> {
        return this.minus(a, this.originOf(a));
    }
    public evaluate(a: OtVarValue<A, M>, instance: VarianceInstance<A>) {
        if (typeof a === "number") return a;
        else return a.evaluate(instance);
    }
    public equal(a: OtVarValue<A, M>, b: OtVarValue<A, M>, err: number = 1) {
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
    public sum(...xs: OtVarValue<A, M>[]) {
        let s: OtVarValue<A, M> = 0;
        for (const x of xs) s = this.add(s, x);
        return s;
    }
    public isConstant(x: OtVarValue<A, M>) {
        if (typeof x === "number") return true;
        return this.equal(x, this.originOf(x), 1 / 0x10000);
    }
    public isZero(x: OtVarValue<A, M>) {
        return this.isConstant(x) && this.originOf(x) === 0;
    }

    public Creator(ms?: VarianceMasterSet<A, M>) {
        return new OtVarCreatorImpl(ms || this.masterSetFactory(), this);
    }
}

export const OtVarOps: VariableOps<
    VarianceDim,
    OtVarMaster<VarianceDim>,
    OtVarValue<VarianceDim, OtVarMaster<VarianceDim>>
> = new OrVarOpsImpl(() => new OtVarMasterSet());
