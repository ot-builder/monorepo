import * as Ot from "@ot-builder/ot";

export class DimMapper {
    private nAxes = 0;
    private mapping: WeakMap<Ot.Var.Dim, number> = new WeakMap();
    private reverseMapping: Ot.Var.Dim[] = [];
    public put(dim: Ot.Var.Dim) {
        let aid = this.mapping.get(dim);
        if (aid != null) return aid;
        aid = this.nAxes++;
        this.mapping.set(dim, aid);
        this.reverseMapping[aid] = dim;
        return aid;
    }
    public alias(dim: Ot.Var.Dim, existing: Ot.Var.Dim) {
        let aid = this.mapping.get(existing);
        if (aid == null) aid = this.put(existing);
        this.mapping.set(dim, aid);
        return aid;
    }
    public reverse(aid: number) {
        return this.reverseMapping[aid];
    }
}

export class MasterProcessor {
    constructor(private readonly dm: DimMapper) {}

    public toArrayRep(master: Ot.Var.Master) {
        const steps: (undefined | [number, number, number])[] = [];
        for (const region of master.regions) {
            const aid = this.dm.put(region.dim);
            steps[aid] = [region.min, region.peak, region.max];
        }
        const stepNumbers: number[] = [];
        for (let aid = 0; aid < steps.length; aid++) {
            const step = steps[aid];
            if (step) stepNumbers.push(aid, step[0], step[1], step[2]);
        }
        return stepNumbers;
    }
    public toUniqueMaster(master: Ot.Var.Master) {
        const steps: (undefined | Ot.Var.MasterDim)[] = [];
        for (const region of master.regions) {
            const aid = this.dm.put(region.dim);
            steps[aid] = {
                dim: this.dm.reverse(aid),
                min: region.min,
                peak: region.peak,
                max: region.max
            };
        }
        return new Ot.Var.Master(steps);
    }
}

export class ValueProcessor {
    constructor(private readonly mp: MasterProcessor) {}
    private cr = new Ot.Var.ValueFactory();

    public toArrayRep(v: Ot.Var.Value) {
        const variances = Array.from(Ot.Var.Ops.varianceOf(v));
        const rep: number[] = [Ot.Var.Ops.originOf(v)];
        const varianceReps: number[][] = [];
        for (const [master, delta] of variances) {
            if (!delta) continue;
            const rep = this.mp.toArrayRep(master);
            varianceReps.push([delta, rep.length, ...rep]);
        }
        varianceReps.sort(ValueProcessor.compareArray);
        rep.push(varianceReps.length);
        for (const vRep of varianceReps) {
            for (const item of vRep) {
                rep.push(item);
            }
        }
        return rep;
    }

    public toUniqueValue(v: Ot.Var.Value) {
        if (Ot.Var.Ops.isConstant(v)) return v;
        const origin = Ot.Var.Ops.originOf(v);
        const variance: [Ot.Var.Master, number][] = [];
        for (const [master, delta] of Ot.Var.Ops.varianceOf(v)) {
            if (delta) {
                variance.push([this.mp.toUniqueMaster(master), delta]);
            }
        }
        return this.cr.create(origin, variance);
    }

    private static compareArray(a: number[], b: number[]) {
        for (let index = 0; index < a.length && index < b.length; index++) {
            if (a[index] === b[index]) {
                continue;
            } else {
                return a[index] - b[index];
            }
        }
        return a.length - b.length;
    }
}
