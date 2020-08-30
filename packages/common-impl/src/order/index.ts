import { Data } from "@ot-builder/prelude";

// Default implementation
export class ListStoreFactory<T> implements Data.OrderStoreFactory<T, ListStore<T>> {
    constructor(private readonly sourceKind: string) {}
    public createStoreFromList(items: Iterable<T>) {
        return new ListStore(this.sourceKind, [...items]);
    }
}
export class ListStoreFactoryWithDefault<T>
    extends ListStoreFactory<T>
    implements Data.OrderStoreFactoryWithDefault<T, ListStore<T>> {
    constructor(sourceKind: string, private readonly create: () => T) {
        super(sourceKind);
    }
    public createStoreFromSize(count: number) {
        const gs: T[] = [];
        for (let gid = 0; gid < count; gid++) gs[gid] = this.create();
        return this.createStoreFromList(gs);
    }
}

export class ListStore<T> implements Data.OrderStore<T> {
    constructor(private readonly sourceKind: string, public readonly items: Array<T>) {}

    public decideOrder(): Data.Order<T> {
        return new ListOrder(this.sourceKind, this.items);
    }
}

class ListOrder<T> implements Data.Order<T> {
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

    public tryAt(gid: number): Data.Maybe<T> {
        return this.items[gid];
    }
    public at(gid: number) {
        const g = this.items[gid];
        if (!g) throw new RangeError(`Missing Item #${gid} in ${this.sourceKind}`);
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
    public tryReverseFallback<F>(g: Data.Maybe<T>, fallback: F) {
        if (g == null) return fallback;
        const gid = this.revMap.get(g);
        if (gid == null) return fallback;
        else return gid;
    }
    public reverse(g: T) {
        const gid = this.tryReverse(g);
        if (gid == null) throw new RangeError(`Missing Item in ${this.sourceKind}`);
        else return gid;
    }
}

export function fromList<T>(sourceKind: string, a: ReadonlyArray<T>): Data.Order<T> {
    return new ListOrder(sourceKind, a);
}
