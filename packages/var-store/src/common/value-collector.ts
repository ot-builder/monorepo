import { GeneralVar } from "@ot-builder/variance";

export abstract class DelayValueCollector<
    A extends GeneralVar.Dim,
    M extends GeneralVar.Master<A>,
    X,
    D
> {
    constructor(
        private readonly op: GeneralVar.Ops<A, M, X>,
        private readonly masterSet: GeneralVar.MasterSet<A, M>
    ) {}

    private masterList: M[] = [];
    private masterIDSet = new Set<number>();
    protected relocation: number[] = [];

    protected abstract createCollectedValue(origin: number, deltaMA: number[]): D;

    protected addMaster(master: M) {
        const rec = this.masterSet.getOrPush(master);
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
        const deltaMA: number[] = [];
        for (const [master, delta] of this.op.varianceOf(x)) {
            if (!delta) continue;
            const index = this.addMaster(master);
            if (index === undefined) continue;
            deltaMA[index] = (deltaMA[index] || 0) + delta;
        }
        return this.createCollectedValue(origin, deltaMA);
    }

    public settleDown() {
        this.relocation = [...this.masterIDSet].sort((a, b) => a - b);
    }

    public resolveDeltas(dma: number[]) {
        const deltas: number[] = [];
        for (let mu = 0; mu < this.relocation.length; mu++) {
            deltas[mu] = dma[this.relocation[mu]] || 0;
        }
        return deltas;
    }

    public getMasterList() {
        return this.relocation.map(r => [r, this.masterList[r]] as [number, M]);
    }

    public get size() {
        return this.masterSet.size;
    }
}
