export type Cons<X, T extends any[]> = ((x: X, ...t: T) => void) extends (...t: infer R) => void
    ? R
    : never;

export function Pair<A, B>(a: A, v: B): [A, B] {
    return [a, v];
}
