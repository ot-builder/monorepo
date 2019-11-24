import { VarianceAxis } from "../interface/axis";
import { VarianceMaster, VarianceMasterSet } from "../interface/master";
import { VariableOps } from "../interface/value";

export type GeneralCollectedValueFactory<
    A extends VarianceAxis,
    M extends VarianceMaster<A>,
    X,
    D
> = (col: GeneralVariableValueCollector<A, M, X, D>, origin: number, deltaMA: number[]) => D;

export class GeneralVariableValueCollector<
    A extends VarianceAxis,
    M extends VarianceMaster<A>,
    X,
    D
> {
    constructor(
        private op: VariableOps<A, M, X>,
        private masterCollector: VarianceMasterSet<A, M>,
        private dvf: GeneralCollectedValueFactory<A, M, X, D>
    ) {}

    private masterList: M[] = [];
    private masterIDSet = new Set<number>();
    protected relocation: number[] = [];

    protected addMaster(master: M) {
        const rec = this.masterCollector.getOrPush(master);
        if (rec) {
            this.masterIDSet.add(rec.index);
            this.masterList[rec.index] = master;
            return rec.index;
        } else {
            return undefined;
        }
    }

    public collect(x: X) {
        const origin = this.op.originOf(x);
        let deltaMA: number[] = [];
        for (const [master, delta] of this.op.varianceOf(x)) {
            if (!delta) continue;
            const index = this.addMaster(master);
            if (index === undefined) continue;
            deltaMA[index] = (deltaMA[index] || 0) + delta;
        }
        return this.dvf(this, origin, deltaMA);
    }

    public settleDown() {
        this.relocation = [...this.masterIDSet].sort((a, b) => a - b);
    }

    public resolveDeltas(dma: number[]) {
        let deltas: number[] = [];
        for (let mu = 0; mu < this.relocation.length; mu++) {
            deltas[mu] = dma[this.relocation[mu]] || 0;
        }
        return deltas;
    }

    public getMasterList() {
        return this.relocation.map(r => [r, this.masterList[r]] as [number, M]);
    }

    get size() {
        return this.masterCollector.size;
    }
}
