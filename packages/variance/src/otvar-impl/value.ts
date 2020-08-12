import * as util from "util";

import { VarianceDim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";
import { VarianceMasterSet } from "../interface/master";

import { OtVarMaster } from "./master";

export type OtVarValue = number | OtVarValueC;

export class OtVarValueC {
    /** delta values */
    private deltaValues: null | Float64Array = null;

    private constructor(
        private readonly masterSet: VarianceMasterSet<VarianceDim, OtVarMaster>,
        public readonly origin: number
    ) {}

    private getVarianceByIndex(index: number) {
        if (!this.deltaValues) {
            return 0;
        } else if (index < this.deltaValues.length) {
            return this.deltaValues[index];
        } else {
            return 0;
        }
    }
    private inPlaceSetVarianceByIndex(index: number, value: number) {
        if (!this.deltaValues) {
            this.deltaValues = new Float64Array(index + 1);
        } else if (this.deltaValues.length <= index) {
            const v1 = new Float64Array(index + 1);
            for (let id = 0; id < this.deltaValues.length; id++) {
                v1[id] = this.deltaValues[id];
            }
            this.deltaValues = v1;
        }
        this.deltaValues[index] = value;
    }
    private inPlaceAddVarianceByIndex(index: number, value: number) {
        if (!this.deltaValues) {
            this.deltaValues = new Float64Array(index + 1);
        } else if (this.deltaValues.length <= index) {
            const v1 = new Float64Array(index + 1);
            for (let id = 0; id < this.deltaValues.length; id++) {
                v1[id] = this.deltaValues[id];
            }
            this.deltaValues = v1;
        }
        this.deltaValues[index] = value + this.deltaValues[index];
    }

    public getDelta(master: OtVarMaster) {
        const rec = this.masterSet.getOrPush(master);
        if (!rec) return 0;
        else return this.getVarianceByIndex(rec.index);
    }
    private setDelta(master: OtVarMaster, value: number) {
        const rec = this.masterSet.getOrPush(master);
        if (rec) this.inPlaceSetVarianceByIndex(rec.index, value);
    }
    private addDelta(master: OtVarMaster, value: number) {
        const rec = this.masterSet.getOrPush(master);
        if (rec)
            this.inPlaceSetVarianceByIndex(rec.index, value + this.getVarianceByIndex(rec.index));
    }
    public *variance(): IterableIterator<[OtVarMaster, number]> {
        for (const [m, index] of this.masterSet) {
            const vv = this.getVarianceByIndex(index);
            if (vv) yield [m, vv];
        }
    }

    public evaluate(instance: VarianceInstance<VarianceDim>) {
        let v = this.origin;
        for (const [master, index] of this.masterSet) {
            v += this.getVarianceByIndex(index) * master.evaluate(instance);
        }
        return v;
    }

    public scaleAddNumber(thisScale: number, other: number) {
        const v1 = new OtVarValueC(this.masterSet, this.origin * thisScale + other);
        if (this.deltaValues) {
            v1.deltaValues = new Float64Array(this.deltaValues.length);
            for (let mid = 0; mid < this.deltaValues.length; mid++) {
                v1.deltaValues[mid] = thisScale * (this.deltaValues[mid] || 0);
            }
        }
        return v1;
    }
    public scaleAddScaleVariable(thisScale: number, otherScale: number, other: OtVarValueC) {
        const v1 = new OtVarValueC(
            this.masterSet,
            thisScale * this.origin + otherScale * other.origin
        );

        if (other.masterSet === this.masterSet) {
            if (this.deltaValues || other.deltaValues) {
                v1.deltaValues = new Float64Array(
                    Math.max(
                        this.deltaValues ? this.deltaValues.length : 0,
                        other.deltaValues ? other.deltaValues.length : 0
                    )
                );
                if (this.deltaValues) {
                    for (let mid = 0; mid < this.deltaValues.length; mid++) {
                        v1.inPlaceAddVarianceByIndex(mid, thisScale * this.deltaValues[mid]);
                    }
                }
                if (other.deltaValues) {
                    for (let mid = 0; mid < other.deltaValues.length; mid++) {
                        v1.inPlaceAddVarianceByIndex(mid, otherScale * other.deltaValues[mid]);
                    }
                }
            }
        } else {
            if (this.deltaValues) {
                v1.deltaValues = new Float64Array(this.deltaValues ? this.deltaValues.length : 0);
                for (let mid = 0; mid < this.deltaValues.length; mid++) {
                    v1.inPlaceAddVarianceByIndex(mid, thisScale * this.deltaValues[mid]);
                }
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

    public static Create(
        masterSet: VarianceMasterSet<VarianceDim, OtVarMaster>,
        origin: number,
        variance: Iterable<[OtVarMaster, number]>
    ) {
        const v = new OtVarValueC(masterSet, origin);
        for (const [master, delta] of variance) v.setDelta(master, delta);
        return v;
    }
}
