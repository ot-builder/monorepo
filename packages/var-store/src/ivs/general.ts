import * as ImpLib from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Algebra } from "@ot-builder/prelude";
import { GeneralVar } from "@ot-builder/variance";

import { DelayValueCollector } from "../common/value-collector";

export class ReadTimeIVD<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor(cr: GeneralVar.ValueFactory<A, M, X>) {
        this.valueCreator = cr;
    }
    public masterIDs: number[] = [];
    public deltas: number[][] = [];
    public valueCreator: GeneralVar.ValueFactory<A, M, X>;
}

export class CReadTimeIVS<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor(private readonly monoidX: Algebra.Monoid<X>) {}
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
    public buildValue(ivd: ReadTimeIVD<A, M, X>, deltas: number[]) {
        const variance: [M, number][] = [];
        for (let mu = 0; mu < deltas.length; mu++) {
            variance.push([this.getMaster(ivd.masterIDs[mu]), deltas[mu]]);
        }
        return ivd.valueCreator.create(0, variance);
    }
    public queryValue(outer: number, inner: number) {
        if (outer === 0xffff && inner === 0xffff) return this.monoidX.neutral;
        const ivd = this.getIVD(outer);
        return this.buildValue(ivd, ivd.deltas[inner]);
    }
}

export class WriteTimeIVD {
    private allocator = new ImpLib.IndexAllocator();
    private mapping = new ImpLib.PathMapImpl<number, number>(); // Path length = arity * mIDs.length
    constructor(
        public readonly long: boolean,
        public readonly arity: number,
        public readonly outerIndex: number,
        public readonly masterIDs: number[]
    ) {}

    public enter(deltas: number[]) {
        const lens = this.mapping.createLens();
        lens.focus(deltas);
        return lens.getOrAlloc(this.allocator) * this.arity;
    }
    public *entries(): IterableIterator<[number[], number]> {
        for (const [deltaRowEntire, innerIDRaw] of this.mapping.entries()) {
            for (let m = 0; m < this.arity; m++) {
                yield [
                    deltaRowEntire.slice(
                        this.masterIDs.length * m,
                        this.masterIDs.length * (m + 1)
                    ),
                    innerIDRaw * this.arity + m
                ];
            }
        }
    }
    public get size() {
        return this.allocator.count * this.arity;
    }
}

export class WriteTimeIVDAllocator {
    private allocOuterID = new ImpLib.IndexAllocator();
    private ivdList: WriteTimeIVD[] = [];
    public next(fLong: boolean, arity: number, r: number[]) {
        const outerID = this.allocOuterID.next();
        const ivd = new WriteTimeIVD(fLong, arity, outerID, r);
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
    private readonly ivdListShort: WriteTimeIVD[][] = [];
    private readonly ivdListLong: WriteTimeIVD[][] = [];
    constructor(
        private nodeAlloc: WriteTimeIVDAllocator,
        private maxInnerIndex: number,
        private readonly masterIDs: number[]
    ) {}

    public getFreeIVD(fLong: boolean, arity: number) {
        const ivdListCollection = fLong ? this.ivdListLong : this.ivdListShort;
        let ivdList = ivdListCollection[arity];
        if (!ivdList) {
            ivdList = [];
            ivdListCollection[arity] = ivdList;
        }
        if (!ivdList.length || ivdList[ivdList.length - 1].size >= this.maxInnerIndex) {
            const ivd = this.nodeAlloc.next(fLong, arity, this.masterIDs);
            ivdList.push(ivd);
            return ivd;
        } else {
            return ivdList[ivdList.length - 1];
        }
    }
}

export class WriteTimeIVDBlossomAllocator implements ImpLib.PathMapAllocator<
    WriteTimeIVDBlossom,
    [number[]]
> {
    constructor(
        private nodeAlloc: WriteTimeIVDAllocator,
        private maxInnerIndex: number
    ) {}
    public next(masterIDs: number[]) {
        return new WriteTimeIVDBlossom(this.nodeAlloc, this.maxInnerIndex, masterIDs);
    }
}

export class WriteTimeIVCollector<
    A extends GeneralVar.Dim,
    M extends GeneralVar.Master<A>,
    X
> extends DelayValueCollector<A, M, X, DelayDeltaValue<A, M, X>> {
    constructor(
        op: GeneralVar.Ops<A, M, X>,
        masterSet: GeneralVar.MasterSet<A, M>,
        private pmBlossom: ImpLib.PathMap<number, WriteTimeIVDBlossom>,
        private acBlossom: WriteTimeIVDBlossomAllocator
    ) {
        super(op, masterSet);
    }

    protected createCollectedValue(origin: number, deltaMA: number[]): DelayDeltaValue<A, M, X> {
        return new DelayDeltaValue(this, origin, deltaMA);
    }

    public getIVD(fLong: boolean, arity: number) {
        this.settleDown();
        if (!this.relocation.length) return null;
        const lens = this.pmBlossom.createLens();
        lens.focus(this.relocation);
        const blossom = lens.getOrAlloc(this.acBlossom, this.relocation);
        return blossom.getFreeIVD(fLong, arity);
    }

    public forceGetIVD(fLong: boolean, arity: number, master: M) {
        this.settleDown();
        if (!this.relocation.length) {
            this.addMaster(master);
            this.settleDown();
        }
        const lens = this.pmBlossom.createLens();
        lens.focus(this.relocation);
        const blossom = lens.getOrAlloc(this.acBlossom, this.relocation);
        return blossom.getFreeIVD(fLong, arity);
    }
}

export class DelayDeltaValue<A extends GeneralVar.Dim, M extends GeneralVar.Master<A>, X> {
    constructor(
        private col: WriteTimeIVCollector<A, M, X>,
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

    private valueToInnerOuterIDImpl(fLong: boolean, xs: X[]) {
        const collector = this.createCollector();
        const dvs = [];
        for (const item of xs) dvs.push(collector.collect(item));

        const ivd = collector.getIVD(fLong, dvs.length);
        if (!ivd) return null;

        const deltas: number[] = [];
        for (const dv of dvs) {
            for (const delta of dv.resolve()) deltas.push(delta);
        }

        const innerIndex = ivd.enter(deltas);
        return { outer: ivd.outerIndex, inner: innerIndex };
    }
    private valueToInnerOuterIDForceImpl(fLong: boolean, xs: X[], fallbackMaster: M) {
        const collector = this.createCollector();
        const dvs = [];
        for (const item of xs) dvs.push(collector.collect(item));

        let ivd = collector.getIVD(fLong, dvs.length);
        if (!ivd) ivd = collector.forceGetIVD(fLong, dvs.length, fallbackMaster);

        const deltas: number[] = [];
        for (const dv of dvs) {
            for (const delta of dv.resolve()) deltas.push(delta);
        }

        const innerIndex = ivd.enter(deltas);
        return { outer: ivd.outerIndex, inner: innerIndex };
    }

    // Target data type being short
    public valueToInnerOuterID(x: X) {
        return this.valueToInnerOuterIDImpl(false, [x]);
    }
    public valueToInnerOuterIDForce(x: X, fallbackMaster: M) {
        return this.valueToInnerOuterIDForceImpl(false, [x], fallbackMaster);
    }
    public multiValueToInnerOuterID(xs: X[]) {
        return this.valueToInnerOuterIDImpl(false, xs);
    }
    public multiValueToInnerOuterIDForce(xs: X[], fallbackMaster: M) {
        return this.valueToInnerOuterIDForceImpl(false, xs, fallbackMaster);
    }

    // Target data type being long
    public longValueToInnerOuterID(x: X) {
        return this.valueToInnerOuterIDImpl(true, [x]);
    }
    public longValueToInnerOuterIDForce(x: X, fallbackMaster: M) {
        return this.valueToInnerOuterIDForceImpl(true, [x], fallbackMaster);
    }
    public multiLongValueToInnerOuterID(xs: X[]) {
        return this.valueToInnerOuterIDImpl(true, xs);
    }
    public multiLongValueToInnerOuterIDForce(xs: X[], fallbackMaster: M) {
        return this.valueToInnerOuterIDForceImpl(true, xs, fallbackMaster);
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
