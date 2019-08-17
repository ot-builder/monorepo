import { VectorSpace } from "@ot-builder/prelude/lib/algebra";

import { VarianceAxis } from "../interface/axis";
import { VarianceInstance } from "../interface/instance";
import { VarianceMaster, VarianceMasterSet } from "../interface/master";
import { VariableCreator, VariableOps } from "../interface/value";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValueC } from "./value";

export type OtVarValue<A extends VarianceAxis, M extends VarianceMaster<A>> =
    | number
    | OtVarValueC<A, M>;

type MasterSetFactory<
    A extends VarianceAxis,
    M extends VarianceMaster<A>
> = () => VarianceMasterSet<A, M>;

class OtVarCreatorImpl<A extends VarianceAxis, M extends VarianceMaster<A>>
    implements VariableCreator<A, M, OtVarValue<A, M>> {
    constructor(
        public readonly masterSet: VarianceMasterSet<A, M>,
        public ops: VectorSpace<OtVarValue<A, M>, number>
    ) {}

    public withMasterSet(x: OtVarValue<A, M>) {
        if (typeof x === "number") return x;
        else return this.create(x.origin, x.variance());
    }
    public create(origin: number = 0, variance: Iterable<[M, number]> = []) {
        if (!variance) return origin;
        const v = new OtVarValueC<A, M>(origin, this.masterSet);
        for (const [m, delta] of variance) {
            if (delta) v.addDelta(m, delta);
        }
        return v;
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

class OrVarOpsImpl<A extends VarianceAxis, M extends VarianceMaster<A>>
    implements VariableOps<A, M, OtVarValue<A, M>> {
    constructor(private readonly masterSetFactory: MasterSetFactory<A, M>) {}

    protected scaleAdd(sa: number, a: OtVarValue<A, M>, sb: number, b: OtVarValue<A, M>) {
        if (typeof a === "number") {
            if (typeof b === "number") return sa * a + sb * b;
            else {
                const b1 = b.scale(sb);
                b1.origin = b1.origin + sa * a;
                return b1;
            }
        } else {
            const a1 = a.scale(sa);
            if (typeof b === "number") {
                a1.origin = a1.origin + sb * b;
            } else {
                a1.origin = a1.origin + sb * b.origin;
                a1.inPlaceAddScale(sb, b);
            }
            return a1;
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
    public sum(...xs: (OtVarValue<A, M> | [number, OtVarValue<A, M>])[]) {
        let s: OtVarValue<A, M> = 0;
        for (const x of xs) {
            if (Array.isArray(x)) s = this.addScale(s, x[0], x[1]);
            else s = this.add(s, x);
        }
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
    VarianceAxis,
    OtVarMaster<VarianceAxis>,
    OtVarValue<VarianceAxis, OtVarMaster<VarianceAxis>>
> = new OrVarOpsImpl(() => new OtVarMasterSet());
