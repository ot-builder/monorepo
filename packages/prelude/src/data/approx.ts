export namespace Approx {
    export function equal(a: number, b: number, tolerance: number) {
        return Math.abs(a - b) <= tolerance;
    }
    export function zero(a: number, tolerance: number) {
        return Math.abs(a) <= tolerance;
    }
    export function between(d1: number, dj: number, d2: number, tolerance: number) {
        return Math.min(d1, d2) - tolerance <= dj && dj <= Math.max(d1, d2) + tolerance;
    }
}
