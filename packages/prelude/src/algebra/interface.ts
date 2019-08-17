export interface Semigroup<T> {
    add(a: T, b: T): T;
}
export interface Monoid<T> extends Semigroup<T> {
    readonly neutral: T;
}
export interface Group<T> extends Monoid<T> {
    negate(a: T): T;
    minus(a: T, b: T): T;
}
export interface Ring<T> extends Group<T> {
    readonly unit: T;
    times(a: T, b: T): T;
}
export interface VectorSpace<T, X> extends Group<T> {
    scale(s: X, b: T): T;
    addScale(a: T, s: X, b: T): T;
}
