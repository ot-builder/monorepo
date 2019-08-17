export interface Lens<S, T> {
    get(s: S): T;
    set(s: S, x: T): S;
}
