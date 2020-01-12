import { Data } from "@ot-builder/prelude";

type DicingPlan<X> = { cls: number; from: null | number; items: null | X[]; inSet: boolean };

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
}

export class DicingStoreImpl<X, Y, D> {
    private clsDefX: Map<X, number> = new Map();
    private coClsDefX: X[][] = [];
    private clsDefY: Map<Y, number> = new Map();
    private coClsDefY: Y[][] = [];

    private dataMatrix: Data.Maybe<D>[][] = [];

    private getData(kx: number, ky: number): Data.Maybe<D> {
        if (!this.dataMatrix[kx]) return undefined;
        return this.dataMatrix[kx][ky];
    }
    private putData(kx: number, ky: number, d: Data.Maybe<D>) {
        if (!this.dataMatrix[kx]) this.dataMatrix[kx] = [];
        this.dataMatrix[kx][ky] = d;
    }

    private getDicingPlan<X>(coCd: X[][], mdf: Set<X>) {
        const plans: DicingPlan<X>[] = [];
        let inSet: X[];
        let outSet: X[];
        let clsNew = coCd.length;
        for (let cl = 0; cl < coCd.length; cl++) {
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
                    plans.push({ cls: clsNew++, from: cl, items: inSet, inSet: true });
                    plans.push({ cls: cl, from: cl, items: outSet, inSet: false });
                } else {
                    plans.push({ cls: cl, from: cl, items: null, inSet: true });
                }
            }
        }
        if (mdf.size) plans.push({ cls: clsNew++, from: null, items: [...mdf], inSet: true });
        return plans;
    }

    public update(
        mdfX: Iterable<X>,
        mdfY: Iterable<Y>,
        fn: (original: Data.Maybe<D>) => Data.Maybe<D>
    ) {
        const planX = this.getDicingPlan(this.coClsDefX, new Set(mdfX));
        const planY = this.getDicingPlan(this.coClsDefY, new Set(mdfY));
        for (const px of planX) {
            if (!px.items) continue;
            this.coClsDefX[px.cls] = px.items;
            if (px.inSet) for (const x of px.items) this.clsDefX.set(x, px.cls);
        }
        for (const py of planY) {
            if (!py.items) continue;
            this.coClsDefY[py.cls] = py.items;
            if (py.inSet) for (const y of py.items) this.clsDefY.set(y, py.cls);
        }
        for (const px of planX) {
            for (const py of planY) {
                if (px.cls === px.from && py.cls === py.from) continue;
                const original =
                    px.from !== null && py.from !== null
                        ? this.getData(px.from, py.from)
                        : undefined;
                this.putData(px.cls, py.cls, original);
            }
        }

        for (const px of planX) {
            if (!px.inSet) continue;
            for (const py of planY) {
                if (!py.inSet) continue;
                this.putData(px.cls, py.cls, fn(this.getData(px.cls, py.cls)));
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
