import { Data } from "@ot-builder/prelude";

type DicingPlan = { cls: number; from: null | number; inSet: boolean };

export interface DicingStore<X, Y, D> {
    get(x: X, y: Y): Data.Maybe<D>;
    getByClass(cx: number, cy: number): Data.Maybe<D>;
    getXClassDef(): X[][];
    getYClassDef(): Y[][];
    entries(): IterableIterator<[X, Y, Data.Maybe<D>]>;

    set(x: Iterable<X>, y: Iterable<Y>, v: D): void;
    setIfAbsent(x: Iterable<X>, y: Iterable<Y>, v: D): void;
    update(
        mdfX: Iterable<X>,
        mdfY: Iterable<Y>,
        fn: (original: Data.Maybe<D>) => Data.Maybe<D>
    ): void;

    toRep(): DicingStoreRep<X, Y, D>;
}
export namespace DicingStore {
    export function create<X, Y, D>(
        rep?: Data.Maybe<DicingStoreRep<X, Y, D>>
    ): DicingStore<X, Y, D> {
        return DicingStoreImpl.FromRep(rep);
    }
}
export interface DicingStoreRep<X, Y, D> {
    xClasses: X[][];
    yClasses: Y[][];
    data: Data.Maybe<D>[][];
}

export class DicingStoreImpl<X, Y, D> implements DicingStore<X, Y, D> {
    private clsDefX: Map<X, number> = new Map();
    private coClsDefX: X[][] = [];
    private clsDefY: Map<Y, number> = new Map();
    private coClsDefY: Y[][] = [];

    private dataMatrix: Data.Maybe<D>[][] = [];

    public static FromRep<X, Y, D>(rep?: Data.Maybe<DicingStoreRep<X, Y, D>>) {
        const store = new DicingStoreImpl<X, Y, D>();
        if (!rep) return store;
        store.clsDefX = toClassMap(rep.xClasses);
        store.coClsDefX = duplicateArray2(rep.xClasses);
        store.clsDefY = toClassMap(rep.yClasses);
        store.coClsDefY = duplicateArray2(rep.yClasses);
        store.dataMatrix = duplicateArray2(rep.data);
        return store;
    }

    public toRep(): DicingStoreRep<X, Y, D> {
        return {
            xClasses: duplicateArray2(this.coClsDefX),
            yClasses: duplicateArray2(this.coClsDefY),
            data: duplicateArray2(this.dataMatrix)
        };
    }

    private getData(kx: number, ky: number): Data.Maybe<D> {
        if (!this.dataMatrix[kx]) return undefined;
        return this.dataMatrix[kx][ky];
    }
    private putData(kx: number, ky: number, d: Data.Maybe<D>) {
        if (!this.dataMatrix[kx]) this.dataMatrix[kx] = [];
        this.dataMatrix[kx][ky] = d;
    }

    private diceOneDimension<X>(cd: Map<X, number>, coCd: X[][], mdf: Set<X>) {
        const plans: DicingPlan[] = [];
        let inSet: X[];
        let outSet: X[];
        const nExistingClasses = coCd.length;
        let nTotalClasses = coCd.length;
        for (let cl = 0; cl < nExistingClasses; cl++) {
            inSet = [];
            outSet = [];
            const kg = coCd[cl];
            if (!kg || !kg.length) continue;
            for (const g of kg) {
                if (mdf.has(g)) {
                    inSet.push(g);
                    mdf.delete(g);
                } else {
                    outSet.push(g);
                }
            }
            if (inSet.length) {
                if (outSet.length) {
                    const clsNew = nTotalClasses++;
                    for (const x of inSet) cd.set(x, clsNew);
                    coCd[clsNew] = inSet;
                    coCd[cl] = outSet;
                    plans.push({ cls: clsNew, from: cl, inSet: true });
                    plans.push({ cls: cl, from: null, inSet: false });
                } else {
                    plans.push({ cls: cl, from: null, inSet: true });
                }
            }
        }
        if (mdf.size) {
            const clsNew = nTotalClasses++;
            for (const x of mdf) cd.set(x, clsNew);
            coCd[clsNew] = [...mdf];
            plans.push({ cls: clsNew, from: null, inSet: true });
        }
        return plans;
    }

    public update(
        mdfX: Iterable<X>,
        mdfY: Iterable<Y>,
        fn: (original: Data.Maybe<D>) => Data.Maybe<D>
    ) {
        const mdfXSet = new Set(mdfX);
        const mdfYSet = new Set(mdfY);
        if (!mdfXSet.size || !mdfYSet.size) return;

        const nOldClsX = this.coClsDefX.length;
        const nOldClsY = this.coClsDefY.length;
        const planX = this.diceOneDimension(this.clsDefX, this.coClsDefX, mdfXSet);
        const planY = this.diceOneDimension(this.clsDefY, this.coClsDefY, mdfYSet);

        for (const px of planX) {
            if (px.from == null) continue;
            for (let cy = 0; cy < nOldClsY; cy++) {
                this.putData(px.cls, cy, this.getData(px.from, cy));
            }
        }
        for (const py of planY) {
            if (py.from == null) continue;
            for (let cx = 0; cx < nOldClsX; cx++) {
                this.putData(cx, py.cls, this.getData(cx, py.from));
            }
        }
        for (const px of planX) {
            for (const py of planY) {
                const cx = px.from == null ? px.cls : px.from;
                const cy = py.from == null ? py.cls : py.from;
                const orig = this.getData(cx, cy);
                if (px.inSet && py.inSet) {
                    this.putData(px.cls, py.cls, fn(orig));
                } else {
                    this.putData(px.cls, py.cls, orig);
                }
            }
        }
    }

    public get(x: X, y: Y) {
        const clX = this.clsDefX.get(x);
        if (clX == null) return undefined;
        const clY = this.clsDefY.get(y);
        if (clY == null) return undefined;
        return this.getData(clX, clY);
    }
    public getByClass(cx: number, cy: number) {
        if (cx < 0 || cy < 0) return undefined;
        return this.getData(cx, cy);
    }

    private getClassDefImpl<X>(cd: Map<X, number>) {
        const a: X[][] = [];
        for (const [x, cl] of cd) {
            if (!a[cl]) a[cl] = [];
            a[cl].push(x);
        }
        for (let cl = 0; cl < a.length; cl++) if (!a[cl]) a[cl] = [];
        return a;
    }

    public getXClassDef() {
        return this.getClassDefImpl(this.clsDefX);
    }
    public getYClassDef() {
        return this.getClassDefImpl(this.clsDefY);
    }

    public *entries(): IterableIterator<[X, Y, Data.Maybe<D>]> {
        for (const [x, c1] of this.clsDefX) {
            for (const [y, c2] of this.clsDefY) {
                yield [x, y, this.getByClass(c1, c2)];
            }
        }
    }

    public set(x: Iterable<X>, y: Iterable<Y>, v: D) {
        this.update(x, y, () => v);
    }
    public setIfAbsent(x: Iterable<X>, y: Iterable<Y>, v: D) {
        this.update(x, y, orig => (orig == null ? v : orig));
    }
}

// util function
function duplicateArray2<T>(a: ReadonlyArray<ReadonlyArray<T>>) {
    const r: T[][] = [];
    for (let cx = 0; cx < a.length; cx++) {
        const row = a[cx] || [];
        r[cx] = [...row];
    }
    return r;
}
function toClassMap<T>(a: ReadonlyArray<ReadonlyArray<T>>) {
    const r: Map<T, number> = new Map();
    for (let cx = 0; cx < a.length; cx++) {
        const row = a[cx];
        if (!row) continue;
        for (const x of row) r.set(x, cx);
    }
    return r;
}
