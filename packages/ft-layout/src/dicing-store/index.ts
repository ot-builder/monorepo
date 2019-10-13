import { Data } from "@ot-builder/prelude";

type DicingPlan<X> = { cls: number; from: null | number; items: null | X[]; inSet: boolean };

export interface DicingStore<X, Y, D> {
    get(x: X, y: Y): Data.Maybe<D>;
    getByClass(cx: number, cy: number): Data.Maybe<D>;
    getXClassDef(): X[][];
    getYClassDef(): Y[][];
    entries(): IterableIterator<[X, Y, Data.Maybe<D>]>;

    set(x: Set<X>, y: Set<Y>, v: D): void;
    setIfAbsent(x: Set<X>, y: Set<Y>, v: D): void;
    update(mdfX: Set<X>, mdfY: Set<Y>, fn: (original: Data.Maybe<D>) => Data.Maybe<D>): void;
}

export class DicingStoreImpl<X, Y, D> {
    private clsDefX: Map<X, number> = new Map();
    private clsDefY: Map<Y, number> = new Map();
    private dataMatrix: Data.Maybe<D>[][] = [];

    private getData(kx: number, ky: number): Data.Maybe<D> {
        if (!this.dataMatrix[kx]) return undefined;
        return this.dataMatrix[kx][ky];
    }
    private putData(kx: number, ky: number, d: Data.Maybe<D>) {
        if (!this.dataMatrix[kx]) this.dataMatrix[kx] = [];
        this.dataMatrix[kx][ky] = d;
    }

    private getDicingPlan<X>(cd: Map<X, number>, mdf: Set<X>) {
        let newClassElements: X[] = [];
        let inSet: X[][] = [];
        let outSet: X[][] = [];
        for (const x of mdf) if (!cd.has(x)) newClassElements.push(x);
        for (const [x, cl] of cd) {
            let a = mdf.has(x) ? inSet : outSet;
            if (!a[cl]) a[cl] = [];
            a[cl].push(x);
        }
        const clsCount = Math.max(inSet.length, outSet.length);
        let clsNew = clsCount;
        let plans: DicingPlan<X>[] = [];
        for (let cl = 0; cl < clsCount; cl++) {
            if (!inSet[cl] || !inSet[cl].length) continue;
            if (outSet[cl] && outSet[cl].length) {
                plans.push({ cls: clsNew++, from: cl, items: inSet[cl], inSet: true });
                plans.push({ cls: cl, from: cl, items: null, inSet: false });
            } else {
                plans.push({ cls: cl, from: cl, items: null, inSet: true });
            }
        }
        if (newClassElements.length) {
            plans.push({ cls: clsNew++, from: null, items: newClassElements, inSet: true });
        }
        return plans;
    }

    public update(mdfX: Set<X>, mdfY: Set<Y>, fn: (original: Data.Maybe<D>) => Data.Maybe<D>) {
        const planX = this.getDicingPlan(this.clsDefX, mdfX);
        const planY = this.getDicingPlan(this.clsDefY, mdfY);
        for (let px of planX) {
            if (px.items) for (const x of px.items) this.clsDefX.set(x, px.cls);
        }
        for (let py of planY) {
            if (py.items) for (const y of py.items) this.clsDefY.set(y, py.cls);
        }
        for (let px of planX) {
            for (let py of planY) {
                if (px.cls === px.from && py.cls === py.from) continue;
                const original =
                    px.from !== null && py.from !== null
                        ? this.getData(px.from, py.from)
                        : undefined;
                this.putData(px.cls, py.cls, original);
            }
        }

        for (let px of planX) {
            if (!px.inSet) continue;
            for (let py of planY) {
                if (!py.inSet) continue;
                this.putData(px.cls, py.cls, fn(this.getData(px.cls, py.cls)));
            }
        }
    }

    public get(x: X, y: Y) {
        let clX = this.clsDefX.get(x);
        if (clX == null) return undefined;
        let clY = this.clsDefY.get(y);
        if (clY == null) return undefined;
        return this.getData(clX, clY);
    }
    public getByClass(cx: number, cy: number) {
        if (cx < 0 || cy < 0) return undefined;
        return this.getData(cx, cy);
    }

    private getClassDefImpl<X>(cd: Map<X, number>) {
        let a: X[][] = [];
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

    public set(x: Set<X>, y: Set<Y>, v: D) {
        this.update(x, y, () => v);
    }
    public setIfAbsent(x: Set<X>, y: Set<Y>, v: D) {
        this.update(x, y, orig => (orig == null ? v : orig));
    }
}
