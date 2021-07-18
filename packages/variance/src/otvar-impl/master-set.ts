import * as ImpLib from "@ot-builder/common-impl";

import { VarianceDim } from "../interface/dimension";
import { VarianceMasterSet } from "../interface/master";

import { OtVarMaster } from "./master";

type VRStep = [number, number, number];

type VRCRecord = {
    readonly master: OtVarMaster;
    readonly index: number;
};

export class OtVarMasterSet implements VarianceMasterSet<VarianceDim, OtVarMaster> {
    private nAxes: number = 0;
    private axisMap: WeakMap<VarianceDim, number> = new WeakMap();

    private masterList: VRCRecord[] = [];
    private masterMap = new ImpLib.PathMapImpl<number, VRCRecord>();
    private masterMapCache = new WeakMap<OtVarMaster, VRCRecord>();

    constructor() {}

    private putAxis(a: VarianceDim) {
        const axisIndex = this.axisMap.get(a);
        if (axisIndex) return axisIndex;
        this.nAxes += 1;
        this.axisMap.set(a, this.nAxes);
        return this.nAxes;
    }
    private getStepNumbers(master: OtVarMaster) {
        const steps: (undefined | VRStep)[] = [];
        for (const region of master.regions) {
            const aid = this.putAxis(region.dim);
            steps[aid] = [region.min, region.peak, region.max];
        }
        const stepNumbers: number[] = [];
        for (let aid = 0; aid < steps.length; aid++) {
            const step = steps[aid];
            if (step) stepNumbers.push(aid, step[0], step[1], step[2]);
        }
        return stepNumbers;
    }

    private getImpl(master: OtVarMaster) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        lens.focus(stepNumbers);

        return lens.get();
    }
    private getOrPutImpl(master: OtVarMaster) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        lens.focus(stepNumbers);

        const existing = lens.get();
        if (existing) return existing;

        const record = { master: master, index: this.masterList.length };
        this.masterList[record.index] = record;
        lens.set(record);
        return record;
    }

    public get(master: OtVarMaster) {
        if (master.isInvalid()) return undefined;
        else return this.getImpl(master);
    }
    public getOrPush(master: OtVarMaster) {
        if (master.isInvalid()) {
            return undefined;
        } else {
            const cached = this.masterMapCache.get(master);
            if (cached) return cached;

            const put = this.getOrPutImpl(master);
            this.masterMapCache.set(master, put);
            return put;
        }
    }
    public get size() {
        return this.masterList.length;
    }
    public *[Symbol.iterator](): IterableIterator<[OtVarMaster, number]> {
        for (const item of this.masterList) yield [item.master, item.index];
    }
}
