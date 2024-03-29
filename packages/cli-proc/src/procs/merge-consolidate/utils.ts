import { Data } from "@ot-builder/prelude";

export function combineList<T>(a: Data.Maybe<ReadonlyArray<T>>, b: Data.Maybe<ReadonlyArray<T>>) {
    return [...(a || []), ...(b || [])];
}

export function mergeMapOpt<K, V>(
    preferred: Data.Maybe<Map<K, V>>,
    less: Data.Maybe<Map<K, V>>,
    mergeValue: (a: V, b: V) => V
): Data.Maybe<Map<K, V>> {
    if (!preferred) return less;
    if (!less) return preferred;
    return mergeMap(preferred, less, mergeValue);
}

export function mergeMap<K, V>(
    preferred: Map<K, V>,
    less: Map<K, V>,
    mergeValue: (a: V, b: V) => V
): Map<K, V> {
    const m: Map<K, V> = new Map(preferred);
    for (const [k, v] of less) {
        if (m.has(k)) {
            m.set(k, mergeValue(m.get(k)!, v));
        } else {
            m.set(k, v);
        }
    }
    return m;
}

export function mergeClassDefOpt<K>(
    preferred: Data.Maybe<Map<K, number>>,
    less: Data.Maybe<Map<K, number>>
): Data.Maybe<Map<K, number>> {
    if (!preferred) return less;
    if (!less) return preferred;
    return mergeClassDef(preferred, less);
}

export function mergeClassDef<K>(preferred: Map<K, number>, less: Map<K, number>): Map<K, number> {
    const m: Map<K, number> = new Map(preferred);
    let maxClass = 0;
    for (const v of m.values()) if (v > maxClass) maxClass = v;
    for (const [k, v] of less) if (!m.has(k)) m.set(k, v + maxClass);
    return m;
}

export function mergeMapAlt<K, V>(
    preferred: Map<K, V>,
    less: Map<K, V>,
    mergeValue: (a: undefined | V, b: undefined | V) => V
): Map<K, V> {
    const keySet = new Set([...preferred.keys(), ...less.keys()]);
    const m: Map<K, V> = new Map();
    for (const k of keySet) {
        m.set(k, mergeValue(preferred.get(k), less.get(k)));
    }
    return m;
}

export function Prime<K>(a: K, b: K) {
    return a;
}
