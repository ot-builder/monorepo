import { Data } from "@ot-builder/prelude";

import { VarianceAxis } from "../interface/axis";
import { VarianceMasterSet } from "../interface/master";

import { OtVarMaster } from "./master";

type VRStep = [number, number, number, number];
function byAxisIndex(a: VRStep, b: VRStep) {
    return a[0] - b[0];
}

type VRCRecord<A extends VarianceAxis> = {
    readonly master: OtVarMaster<A>;
    readonly index: number;
};

export class OtVarMasterSet<A extends VarianceAxis>
    implements VarianceMasterSet<A, OtVarMaster<A>> {
    private nAxes: number = 0;
    private axisMap: Map<A, number> = new Map();

    private nMasters: number = 0;
    private masterMap: Data.PathMap<number, VRCRecord<A>> = new Data.PathMap();

    constructor(
        protected readonly axisFilter?: (a: A) => boolean,
        protected readonly sortAxes?: boolean
    ) {}

    private putAxis(a: A) {
        const axisIndex = this.axisMap.get(a);
        if (axisIndex) return axisIndex;
        this.nAxes += 1;
        this.axisMap.set(a, this.nAxes);
        return this.nAxes;
    }
    private getStepNumbers(master: OtVarMaster<A>) {
        const stepNumbers: VRStep[] = [];
        for (const region of master.regions) {
            if (this.axisFilter && !this.axisFilter(region.axis)) continue;
            stepNumbers.push([this.putAxis(region.axis), region.min, region.peak, region.max]);
        }
        if (this.sortAxes) stepNumbers.sort(byAxisIndex);
        return stepNumbers;
    }

    private getImpl(master: OtVarMaster<A>) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        for (const step of stepNumbers) lens.focus(step);

        return lens.get();
    }
    private getOrPutImpl(master: OtVarMaster<A>) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        for (const step of stepNumbers) lens.focus(step);

        const existing = lens.get();
        if (existing) return existing;

        const record = { master: master, index: this.nMasters };
        this.nMasters += 1;
        lens.set(record);
        return record;
    }

    public get(master: OtVarMaster<A>) {
        if (master.isInvalid()) return undefined;
        else return this.getImpl(master);
    }
    public getOrPush(master: OtVarMaster<A>) {
        if (master.isInvalid()) return undefined;
        else return this.getOrPutImpl(master);
    }
    get size() {
        return this.nMasters;
    }
    public *[Symbol.iterator](): IterableIterator<[OtVarMaster<A>, number]> {
        for (const item of this.masterMap.values()) {
            yield [item.master, item.index];
        }
    }
}
