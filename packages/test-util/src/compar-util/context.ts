import { Data } from "@ot-builder/prelude";

export interface CompareContext<C> {
    readonly derived: boolean;
    CreateForward(): C;
    CreateFlip(): C;
}

export type CompareFunction<C extends CompareContext<C>, T> = (
    ctx: C,
    actual: T,
    expected: T,
    place?: string
) => void;

export function symmetricCompare<C extends CompareContext<C>, T>(f: CompareFunction<C, T>) {
    return (ctx: C, a: T, b: T, place?: string) => {
        if (ctx.derived) {
            f(ctx, a, b, place);
        } else {
            f(ctx.CreateForward(), a, b);
            f(ctx.CreateFlip(), b, a);
        }
    };
}
export function bothNullOrNot<C extends CompareContext<C>, T>(f: CompareFunction<C, T>) {
    return (bim: C, a: Data.Maybe<T>, b: Data.Maybe<T>) => {
        expect(!!a).toBe(!!b);
        if (a && b) f(bim, a, b);
    };
}

export function StdCompare<C extends CompareContext<C>, T>(f: CompareFunction<C, T>) {
    return symmetricCompare(bothNullOrNot(f));
}

export namespace Compare {
    export function optional<C extends CompareContext<C>, T>(
        ctx: C,
        a: Data.Maybe<T>,
        b: Data.Maybe<T>,
        f: CompareFunction<C, T>
    ) {
        expect(!!a).toBe(!!b);
        if (a && b) f(ctx, a, b);
    }
    export function map<C extends CompareContext<C>, A, T>(
        ctx: C,
        a: ReadonlyMap<A, T>,
        b: ReadonlyMap<A, T>,
        f: CompareFunction<C, T>
    ) {
        for (const [key, va] of a) {
            const vb = b.get(key);
            if (!vb) throw new TypeError(`missing value for ${key}`);
            f(ctx, va, vb);
        }
    }
}
