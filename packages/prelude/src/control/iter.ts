export function* Fallback<T>(iter: Iterable<T>, fallback: T): Iterable<T> {
    for (const x of iter) {
        if (x === undefined) yield fallback;
        else yield x;
    }
}
export function* ToCount<T>(iter: Iterable<T>, count: number, fallback: T): Iterable<T> {
    let c = 0;
    for (const x of iter) {
        if (x === undefined) yield fallback;
        else yield x;
        c += 1;
        if (c >= count) return;
    }
    for (; c < count; c++) {
        yield fallback;
    }
}
export function* ToCountIndex<T>(
    iter: Iterable<T>,
    count: number,
    fallback: T
): Iterable<[T, number]> {
    let c = 0;
    for (const x of iter) {
        if (x === undefined) yield [fallback, c];
        else yield [x, c];
        c += 1;
        if (c >= count) return;
    }
    for (; c < count; c++) {
        yield [fallback, c];
    }
}
export function* ZipWithIndex<A, B>(
    as: ReadonlyArray<A>,
    bs: ReadonlyArray<B>
): IterableIterator<[A, B, number]> {
    if (as.length !== bs.length) throw new Error("length mismatch");
    for (let id = 0; id < as.length; id++) {
        yield [as[id], bs[id], id];
    }
}
export function* Zip3WithIndex<A, B, C>(
    as: ReadonlyArray<A>,
    bs: ReadonlyArray<B>,
    cs: ReadonlyArray<C>
): IterableIterator<[A, B, C, number]> {
    if (as.length !== bs.length) throw new Error("length mismatch");
    if (as.length !== cs.length) throw new Error("length mismatch");
    for (let id = 0; id < as.length; id++) {
        yield [as[id], bs[id], cs[id], id];
    }
}
export function* Range(start: number, end: number): IterableIterator<number> {
    for (let x = start; x < end; x++) yield x;
}
export function Iota(start: number, end: number) {
    return Array.from(Range(start, end));
}
