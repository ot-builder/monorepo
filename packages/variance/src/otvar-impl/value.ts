import * as util from "util";

import { VarianceAxis } from "../interface/axis";
import { VarianceInstance } from "../interface/instance";
import { VarianceMaster, VarianceMasterSet } from "../interface/master";

export class OtVarValueC<A extends VarianceAxis, M extends VarianceMaster<A>> {
    /** delta values */
    private readonly deltaValues: number[] = [];

    constructor(public origin: number, private readonly masterSet: VarianceMasterSet<A, M>) {}

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

    public getDelta(master: M) {
        const rec = this.masterSet.getOrPush(master);
        if (!rec) return 0;
        else return this.getVarianceByIndex(rec.index);
    }
    public setDelta(master: M, value: number) {
        const rec = this.masterSet.getOrPush(master);
        if (rec) this.setVarianceByIndex(rec.index, value);
    }
    public addDelta(master: M, value: number) {
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

    public scale(scale: number) {
        const v1 = new OtVarValueC<A, M>(this.origin * scale, this.masterSet);
        for (const [master, index] of this.masterSet) {
            v1.setDelta(master, this.getVarianceByIndex(index) * scale);
        }
        return v1;
    }
    public inPlaceAddScale(scale: number, other: OtVarValueC<A, M>) {
        if (other.masterSet === this.masterSet) {
            for (let mid = 0; mid < other.deltaValues.length; mid++) {
                this.deltaValues[mid] =
                    (this.deltaValues[mid] || 0) + scale * (other.deltaValues[mid] || 0);
            }
        } else {
            for (const [master, variance] of other.variance()) {
                this.addDelta(master, scale * variance);
            }
        }
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
}
