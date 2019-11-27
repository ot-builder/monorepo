import { Maybe } from "./maybe";

export interface OrderStoreFactory<T, S extends OrderStore<T> = OrderStore<T>> {
    createStoreFromList(initGlyphs: Iterable<T>): S;
}

export interface OrderStoreFactoryWithDefault<T, S extends OrderStore<T> = OrderStore<T>>
    extends OrderStoreFactory<T, S> {
    createStoreFromSize(count: number): S;
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
