export function pmod(j: number, n: number) {
    return ((j % n) + n) % n;
}
export function d2(columns: number, row: number, column: number) {
    return row * columns + column;
}
export function rowCount<T>(a: ReadonlyArray<T>, columns: number) {
    return (a.length / columns) | 0;
}

// re-exports
export * from "./rounding";
export * from "./approx";
