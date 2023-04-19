export function setEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
    for (const g of a) if (!b.has(g)) return false;
    for (const g of b) if (!a.has(g)) return false;
    return true;
}
