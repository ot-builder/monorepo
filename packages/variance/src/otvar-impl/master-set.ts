import { ImpLib } from "@ot-builder/common-impl";

import { VarianceDim } from "../interface/dimension";
import { VarianceMasterSet } from "../interface/master";

import { OtVarMaster } from "./master";

type VRStep = [number, number, number];

type VRCRecord<A extends VarianceDim> = {
    readonly master: OtVarMaster<A>;
    readonly index: number;
};

export class OtVarMasterSet<A extends VarianceDim>
    implements VarianceMasterSet<A, OtVarMaster<A>> {
    private nAxes: number = 0;
    private axisMap: WeakMap<A, number> = new WeakMap();

    private nMasters: number = 0;
    private masterMap = new ImpLib.PathMapImpl<number, VRCRecord<A>>();

    constructor() {}

    private putAxis(a: A) {
        const axisIndex = this.axisMap.get(a);
        if (axisIndex) return axisIndex;
        this.nAxes += 1;
        this.axisMap.set(a, this.nAxes);
        return this.nAxes;
    }
    private getStepNumbers(master: OtVarMaster<A>) {
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

    private getImpl(master: OtVarMaster<A>) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        lens.focus(stepNumbers);

        return lens.get();
    }
    private getOrPutImpl(master: OtVarMaster<A>) {
        const stepNumbers = this.getStepNumbers(master);
        const lens = this.masterMap.createLens();
        lens.focus(stepNumbers);

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
