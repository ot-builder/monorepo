import * as util from "util";

import { VarianceDim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";
import { VarianceMaster, VarianceMasterSet } from "../interface/master";

export class OtVarValueC<A extends VarianceDim, M extends VarianceMaster<A>> {
    /** delta values */
    private readonly deltaValues: number[] = [];

    private constructor(
        private readonly masterSet: VarianceMasterSet<A, M>,
        public readonly origin: number
    ) {}

    private getVarianceByIndex(index: number) {
        if (index < this.deltaValues.length) {
            return this.deltaValues[index] || 0;
        } else {
            return 0;
        }
    }
    private setVarianceByIndex(index: number, value: number) {
        this.deltaValues[index] = value;
    }
    private addVarianceByIndex(index: number, value: number) {
        this.deltaValues[index] = value + this.getVarianceByIndex(index);
    }

    public getDelta(master: M) {
        const rec = this.masterSet.getOrPush(master);
        if (!rec) return 0;
        else return this.getVarianceByIndex(rec.index);
    }
    private setDelta(master: M, value: number) {
        const rec = this.masterSet.getOrPush(master);
        if (rec) this.setVarianceByIndex(rec.index, value);
    }
    private addDelta(master: M, value: number) {
        const rec = this.masterSet.getOrPush(master);
        if (rec) this.setVarianceByIndex(rec.index, value + this.getVarianceByIndex(rec.index));
    }
    public *variance(): IterableIterator<[M, number]> {
        for (const [m, index] of this.masterSet) {
            const vv = this.getVarianceByIndex(index);
            if (vv) yield [m, vv];
        }
    }

    public evaluate(instance: VarianceInstance<A>) {
        let v = this.origin;
        for (const [master, index] of this.masterSet) {
            v += this.getVarianceByIndex(index) * master.evaluate(instance);
        }
        return v;
    }

    public scaleAddNumber(thisScale: number, other: number) {
        const v1 = new OtVarValueC<A, M>(this.masterSet, this.origin * thisScale + other);
        for (let mid = 0; mid < this.deltaValues.length; mid++) {
            v1.deltaValues[mid] = thisScale * (this.deltaValues[mid] || 0);
        }
        return v1;
    }
    public scaleAddScaleVariable(thisScale: number, otherScale: number, other: OtVarValueC<A, M>) {
        const v1 = new OtVarValueC<A, M>(
            this.masterSet,
            thisScale * this.origin + otherScale * other.origin
        );

        if (other.masterSet === this.masterSet) {
            for (let mid = 0; mid < this.deltaValues.length; mid++) {
                v1.addVarianceByIndex(mid, thisScale * this.getVarianceByIndex(mid));
            }
            for (let mid = 0; mid < other.deltaValues.length; mid++) {
                v1.addVarianceByIndex(mid, otherScale * other.getVarianceByIndex(mid));
            }
        } else {
            for (const [master, variance] of this.variance()) {
                v1.addDelta(master, thisScale * variance);
            }
            for (const [master, variance] of other.variance()) {
                v1.addDelta(master, otherScale * variance);
            }
        }
        return v1;
    }

    public toString() {
        let s: string = "" + this.origin;
        for (const [master, delta] of this.variance()) {
            s += (delta >= 0 ? " + " + delta : " - " + -delta) + " " + master;
        }
        return s;
    }

    public [util.inspect.custom]() {
        return "{" + this.toString() + "}";
    }

    public static Create<A extends VarianceDim, M extends VarianceMaster<A>>(
        masterSet: VarianceMasterSet<A, M>,
        origin: number,
        variance: Iterable<[M, number]>
    ) {
        const v = new OtVarValueC(masterSet, origin);
        for (const [master, delta] of variance) v.setDelta(master, delta);
        return v;
    }
}
