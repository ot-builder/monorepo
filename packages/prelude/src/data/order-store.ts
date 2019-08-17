import { Maybe } from "./interface";

export interface OrderStoreFactory<T, S extends OrderStore<T> = OrderStore<T>> {
    createStoreFromSize(count: number): S;
    createStoreFromList(initGlyphs: Iterable<T>): S;
}
export interface OrderStore<T> {
    decideOrder(): Order<T>;
}

export interface Order<T> {
    readonly length: number;

    // index helper
    modIndex(ix: number): number;

    // Forward indexing
    at(index: number): T; // MUST throw when not found
    tryAt(index: number): Maybe<T>;

    // Reverse indexing
    reverse(item: T): number; // MUST throw when not found
    tryReverse(item: T): Maybe<number>;
    tryReverseFallback<F>(item: Maybe<T>, fallback: F): number | F;

    // Iterators
    [Symbol.iterator](): IterableIterator<T>;
    entries(): IterableIterator<[number, T]>;
}

export namespace Order {
    export function fromList<T>(sourceKind: string, a: ReadonlyArray<T>): Order<T> {
        return new ListOrder(sourceKind, a);
    }
}

// list impl

// Default implementation
export class ListStoreFactory<T> implements OrderStoreFactory<T, ListStore<T>> {
    constructor(private readonly sourceKind: string, private readonly create: () => T) {}
    public createStoreFromList(items: Iterable<T>) {
        return new ListStore(this.sourceKind, [...items]);
    }
    public createStoreFromSize(count: number) {
        let gs: T[] = [];
        for (let gid = 0; gid < count; gid++) gs[gid] = this.create();
        return this.createStoreFromList(gs);
    }
}

class ListStore<T> implements OrderStore<T> {
    constructor(private readonly sourceKind: string, public readonly items: Array<T>) {}

    public decideOrder(): Order<T> {
        return new ListOrder(this.sourceKind, this.items);
    }
}

class ListOrder<T> implements Order<T> {
    constructor(private readonly sourceKind: string, private readonly items: ReadonlyArray<T>) {
        this.length = items.length;
        this.revMap = new Map();
        for (let gid = 0; gid < items.length; gid++) {
            this.revMap.set(items[gid], gid);
        }
    }

    public length: number;
    private revMap: Map<T, number>;

    public modIndex(ix: number) {
        return ((ix % this.length) + this.length) % this.length;
    }

    public tryAt(gid: number): Maybe<T> {
        return this.items[gid];
    }
    public at(gid: number) {
        let g = this.items[gid];
        if (!g) throw new RangeError(`Missing Item in ${this.sourceKind}`);
        else return g;
    }
    public [Symbol.iterator](): IterableIterator<T> {
        return this.items[Symbol.iterator]();
    }
    public entries(): IterableIterator<[number, T]> {
        return this.items.entries();
    }
    public tryReverse(g: T) {
        return this.revMap.get(g);
    }
    public tryReverseFallback<F>(g: Maybe<T>, fallback: F) {
        if (g == null) return fallback;
        let gid = this.revMap.get(g);
        if (gid == null) return fallback;
        else return gid;
    }
    public reverse(g: T) {
        const gid = this.tryReverse(g);
        if (gid == null) throw new RangeError(`Missing Item in ${this.sourceKind}`);
        else return gid;
    }
}
