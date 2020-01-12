import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { GeneralVar, GeneralVarInternalImpl } from "@ot-builder/variance";

export class ReadTimeIVD<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor(cr: GeneralVar.ValueFactory<A, M, X>) {
        this.valueCreator = cr;
    }
    public masterIDs: number[] = [];
    public deltas: number[][] = [];
    public valueCreator: GeneralVar.ValueFactory<A, M, X>;
}

export class CReadTimeIVS<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor() {}
    public knownMasters: M[] = [];
    public itemVariationData: ReadTimeIVD<A, M, X>[] = [];

    public tryGetIVD(outer: number): null | ReadTimeIVD<A, M, X> {
        return this.itemVariationData[outer] || null;
    }
    public getIVD(outer: number): ReadTimeIVD<A, M, X> {
        if (!this.itemVariationData[outer]) throw Errors.Variation.IndexOverflow("outer", outer);
        return this.itemVariationData[outer];
    }
    public getMaster(id: number): M {
        const master = this.knownMasters[id];
        if (!master) throw Errors.Variation.IndexOverflow(`master`, id);
        return master;
    }
    public getMasterList(outer: number): M[] {
        const ivd = this.getIVD(outer);
        const masters: M[] = [];
        for (const id of ivd.masterIDs) masters.push(this.getMaster(id));
        return masters;
    }
    public buildValue(ivd: ReadTimeIVD<A, M, X>, deltas: number[]) {
        const variance: [M, number][] = [];
        for (let mu = 0; mu < deltas.length; mu++) {
            variance.push([this.getMaster(ivd.masterIDs[mu]), deltas[mu]]);
        }
        return ivd.valueCreator.create(0, variance);
    }
    public queryValue(outer: number, inner: number) {
        const ivd = this.getIVD(outer);
        return this.buildValue(ivd, ivd.deltas[inner]);
    }
}

export class WriteTimeIVD {
    private allocator = new ImpLib.IndexAllocator();
    public mapping = new ImpLib.PathMapImpl<number, number>();
    constructor(public readonly outerIndex: number, readonly masterIDs: number[]) {}

    public find(deltas: number[]) {
        return this.mapping.get(deltas);
    }
    public enter(deltas: number[]) {
        const lens = this.mapping.createLens();
        lens.focus(deltas);
        return lens.getOrAlloc(this.allocator);
    }
    public entries() {
        return this.mapping.entries();
    }
    get size() {
        return this.allocator.count;
    }
}

export class WriteTimeIVDAllocator implements ImpLib.Allocator<WriteTimeIVD, [number[]]> {
    private allocOuterID = new ImpLib.IndexAllocator();
    private ivdList: WriteTimeIVD[] = [];
    public next(r: number[]) {
        const outerID = this.allocOuterID.next();
        const ivd = new WriteTimeIVD(outerID, r);
        this.ivdList[outerID] = ivd;
        return ivd;
    }
    public *entries() {
        yield* this.ivdList;
    }
    public isEmpty() {
        return !this.ivdList || !this.ivdList.length;
    }
}

export class WriteTimeIVDBlossom {
    private readonly ivdList: WriteTimeIVD[] = [];
    constructor(
        private nodeAlloc: WriteTimeIVDAllocator,
        private maxInnerIndex: number,
        private readonly masterIDs: number[]
    ) {}

    public getFreeIVD() {
        if (
            !this.ivdList.length ||
            this.ivdList[this.ivdList.length - 1].size >= this.maxInnerIndex
        ) {
            const ivd = this.nodeAlloc.next(this.masterIDs);
            this.ivdList.push(ivd);
            return ivd;
        } else {
            return this.ivdList[this.ivdList.length - 1];
        }
    }
}

export class WriteTimeIVDBlossomAllocator
    implements ImpLib.Allocator<WriteTimeIVDBlossom, [number[]]> {
    constructor(private nodeAlloc: WriteTimeIVDAllocator, private maxInnerIndex: number) {}
    public next(masterIDs: number[]) {
        return new WriteTimeIVDBlossom(this.nodeAlloc, this.maxInnerIndex, masterIDs);
    }
}

export class WriteTimeIVCollector<
    A extends GeneralVar.Dim,
    M extends GeneralVar.Master<A>,
    X
> extends GeneralVarInternalImpl.ValueCollector<A, M, X, DelayDeltaValue<A, M, X>> {
    constructor(
        op: GeneralVar.Ops<A, M, X>,
        masterCollector: GeneralVar.MasterSet<A, M>,
        private pmBlossom: ImpLib.PathMap<number, WriteTimeIVDBlossom>,
        private acBlossom: WriteTimeIVDBlossomAllocator
    ) {
        super(
            op,
            masterCollector,
            (col, origin, deltaMA) => new DelayDeltaValue(col, origin, deltaMA)
        );
    }
    public getIVD() {
        this.settleDown();
        if (!this.relocation.length) return null;
        const lens = this.pmBlossom.createLens();
        lens.focus(this.relocation);
        const blossom = lens.getOrAlloc(this.acBlossom, this.relocation);
        return blossom.getFreeIVD();
    }
    public forceGetIVD(master: M) {
        this.settleDown();
        if (!this.relocation.length) {
            this.addMaster(master);
            this.settleDown();
        }
        const lens = this.pmBlossom.createLens();
        lens.focus(this.relocation);
        const blossom = lens.getOrAlloc(this.acBlossom, this.relocation);
        return blossom.getFreeIVD();
    }
}

export class DelayDeltaValue<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor(
        private col: GeneralVar.ValueCollector<A, M, X, DelayDeltaValue<A, M, X>>,
        public origin: number,
        private deltaMA: number[]
    ) {}
    public resolve() {
        return this.col.resolveDeltas(this.deltaMA);
    }
}

export class GeneralWriteTimeIVStore<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    private pmBlossom: ImpLib.PathMap<number, WriteTimeIVDBlossom>;
    private acBlossom: WriteTimeIVDBlossomAllocator;
    private acIVD: WriteTimeIVDAllocator;
    constructor(
        private readonly op: GeneralVar.Ops<A, M, X>,
        private readonly masterCollector: GeneralVar.MasterSet<A, M>,
        private maxInnerIndex: number
    ) {
        this.pmBlossom = new ImpLib.PathMapImpl();
        this.acIVD = new WriteTimeIVDAllocator();
        this.acBlossom = new WriteTimeIVDBlossomAllocator(this.acIVD, this.maxInnerIndex);
    }

    public createCollector() {
        return new WriteTimeIVCollector<A, M, X>(
            this.op,
            this.masterCollector,
            this.pmBlossom,
            this.acBlossom
        );
    }

    public valueToInnerOuterID(x: X) {
        const collector = this.createCollector();
        const dv = collector.collect(x);
        const ivd = collector.getIVD();
        if (!ivd) return null;
        const deltas = dv.resolve();
        const innerIndex = ivd.enter(deltas);
        return { outer: ivd.outerIndex, inner: innerIndex };
    }
    public valueToInnerOuterIDForce(x: X, fallbackMaster: M) {
        const collector = this.createCollector();
        const dv = collector.collect(x);
        let ivd = collector.getIVD();
        if (!ivd) ivd = collector.forceGetIVD(fallbackMaster);
        const deltas = dv.resolve();
        const innerIndex = ivd.enter(deltas);
        return { outer: ivd.outerIndex, inner: innerIndex };
    }
    public isEmpty() {
        return this.masterCollector.size === 0 || this.acIVD.isEmpty();
    }

    public *masters(): Iterable<[M, number]> {
        yield* this.masterCollector;
    }
    public ivdList() {
        return this.acIVD.entries();
    }
}
