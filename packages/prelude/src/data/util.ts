export namespace Util {
    export function setEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
        for (let g of a) if (!b.has(g)) return false;
        for (let g of b) if (!a.has(g)) return false;
        return true;
    }
}
