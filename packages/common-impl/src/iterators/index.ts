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
export function ArrToCount<T>(iter: ReadonlyArray<T>, fallback: T) {
    return ToCount(iter, iter.length, fallback);
}
export function* FlatMatrixSized<T>(
    mat: ReadonlyArray<ReadonlyArray<T>>,
    columns: number,
    fallback: T
) {
    const rows = mat.length;
    for (let p = 0; p < rows; p++) {
        const row = mat[p];
        for (let q = 0; q < columns; q++) {
            if (!row) yield [fallback, p, q];
            else yield [row[q] ?? fallback, p, q];
        }
    }
}
export function FlatMatrixAutoSize<T>(mat: ReadonlyArray<ReadonlyArray<T>>, fallback: T) {
    const rows = mat.length;
    let columns = 0;
    for (let p = 0; p < rows; p++) {
        if (mat[p] && mat[p].length > columns) columns = mat[p].length;
    }
    return FlatMatrixSized(mat, columns, fallback);
}

export function* Zip<A, B>(as: ReadonlyArray<A>, bs: ReadonlyArray<B>): IterableIterator<[A, B]> {
    if (as.length !== bs.length) throw new Error("length mismatch");
    for (let id = 0; id < as.length; id++) {
        yield [as[id], bs[id]];
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
export function* ZipWithIndexReverse<A, B>(
    as: ReadonlyArray<A>,
    bs: ReadonlyArray<B>
): IterableIterator<[A, B, number]> {
    if (as.length !== bs.length) throw new Error("length mismatch");
    for (let id = as.length; id-- > 0; ) {
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
