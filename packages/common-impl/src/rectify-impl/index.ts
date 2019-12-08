import { Rectify, Trace } from "@ot-builder/prelude";

// Rectifiable implementation methods
export namespace RectifyImpl {
    export function Id<R, X>(r: R, x: X): X {
        return x;
    }
    export function maybeT<R, X>(
        rec: R,
        x: null | undefined | X,
        fn: (rec: R, x: X) => null | undefined | X
    ) {
        if (!x) return x;
        else return fn(rec, x);
    }
    export function setAllT<R, X>(
        rec: R,
        xs: ReadonlySet<X>,
        fn: (rec: R, x: X) => null | undefined | X
    ) {
        let xs1: Set<X> = new Set();
        for (let x of xs) {
            const x1 = fn(rec, x);
            if (x1) xs1.add(x1);
            else return null;
        }
        return xs1;
    }
    export function setSomeT<R, X>(
        rec: R,
        xs: ReadonlySet<X>,
        fn: (rec: R, x: X) => null | undefined | X
    ) {
        let xs1: Set<X> = new Set();
        for (let x of xs) {
            const x1 = fn(rec, x);
            if (x1) xs1.add(x1);
        }
        return xs1;
    }
    export function listAllT<R, X>(
        rectifier: R,
        m: ReadonlyArray<X>,
        fn: (re: R, x: X) => null | undefined | X
    ) {
        let m1: X[] = [];
        for (const x of m) {
            const x1 = fn(rectifier, x);
            if (x1 == null) return null;
            else m1.push(x1);
        }
        return m1;
    }
    export function listSomeT<R, X>(
        rectifier: R,
        m: ReadonlyArray<X>,
        fn: (re: R, x: X) => null | undefined | X
    ) {
        let m1: X[] = [];
        for (const x of m) {
            const x1 = fn(rectifier, x);
            if (x1 != null) m1.push(x1);
        }
        return m1;
    }
    export function listSparseT<R, X>(
        rectifier: R,
        m: ReadonlyArray<null | undefined | X>,
        fn: (re: R, x: X) => null | undefined | X
    ) {
        let m1: Array<null | undefined | X> = [];
        for (const x of m) {
            if (x == null) m1.push(x);
            else m1.push(fn(rectifier, x));
        }
        return m1;
    }
    export function mapAllT<R, X, Y>(
        rectifier: R,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R, x: X) => null | undefined | X,
        fnY: (re: R, y: Y) => null | undefined | Y
    ) {
        let m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier, x);
            if (x1 == null) return null;
            const y1 = fnY(rectifier, y);
            if (y1 == null) return null;
            m1.set(x1, y1);
        }
        return m1;
    }
    export function mapAll2T<R, X, Y>(
        rectifier: R,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R, x: X) => null | undefined | X,
        fnY: (re: R, x1: X, y: Y) => null | undefined | Y
    ) {
        let m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier, x);
            if (x1 == null) return null;
            const y1 = fnY(rectifier, x1, y);
            if (y1 == null) return null;
            m1.set(x1, y1);
        }
        return m1;
    }
    export function mapSomeT<R, X, Y>(
        rectifier: R,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R, x: X) => null | undefined | X,
        fnY: (re: R, y: Y) => null | undefined | Y
    ) {
        let m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier, x);
            if (x1 == null) continue;
            const y1 = fnY(rectifier, y);
            if (y1 == null) continue;
            m1.set(x1, y1);
        }
        return m1;
    }
    export function mapSome2T<R, X, Y>(
        rectifier: R,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R, x: X) => null | undefined | X,
        fnY: (re: R, x1: X, y: Y) => null | undefined | Y
    ) {
        let m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier, x);
            if (x1 == null) continue;
            const y1 = fnY(rectifier, x1, y);
            if (y1 == null) continue;
            m1.set(x1, y1);
        }
        return m1;
    }

    export namespace Glyph {
        function single<G>(rectifier: Rectify.Glyph.RectifierT<G>, g: G) {
            return rectifier.glyph(g);
        }
        export function setAll<G>(rec: Rectify.Glyph.RectifierT<G>, gs: ReadonlySet<G>) {
            return RectifyImpl.setAllT(rec, gs, single);
        }
        export function setSome<G>(rec: Rectify.Glyph.RectifierT<G>, gs: ReadonlySet<G>) {
            return RectifyImpl.setSomeT(rec, gs, single);
        }
        export function listAll<G>(rec: Rectify.Glyph.RectifierT<G>, gs: ReadonlyArray<G>) {
            return RectifyImpl.listAllT(rec, gs, single);
        }
        export function listSome<G>(rec: Rectify.Glyph.RectifierT<G>, gs: ReadonlyArray<G>) {
            return RectifyImpl.listSomeT(rec, gs, single);
        }
        export function listSparse<G>(rec: Rectify.Glyph.RectifierT<G>, gs: ReadonlyArray<G>) {
            return RectifyImpl.listSparseT(rec, gs, single);
        }
        export function bimapAll<G>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<G, G>) {
            return RectifyImpl.mapAllT(rec, gm, single, single);
        }
        export function bimapSome<G>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<G, G>) {
            return RectifyImpl.mapSomeT(rec, gm, single, single);
        }
        export function mapAll<G, X>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<G, X>) {
            return RectifyImpl.mapAllT(rec, gm, single, (r, x) => x);
        }
        export function mapSome<G, X>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<G, X>) {
            return RectifyImpl.mapSomeT(rec, gm, single, (r, x) => x);
        }
        export function comapAll<G, X>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<X, G>) {
            return RectifyImpl.mapAllT(rec, gm, (r, x) => x, single);
        }
        export function comapSome<G, X>(rec: Rectify.Glyph.RectifierT<G>, gm: ReadonlyMap<X, G>) {
            return RectifyImpl.mapSomeT(rec, gm, (r, x) => x, single);
        }
        export function mapAllT<G, X>(
            rec: Rectify.Glyph.RectifierT<G>,
            gm: ReadonlyMap<G, X>,
            fn: (rec: Rectify.Glyph.RectifierT<G>, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, single, fn);
        }
        export function mapSomeT<G, X>(
            rec: Rectify.Glyph.RectifierT<G>,
            gm: ReadonlyMap<G, X>,
            fn: (rec: Rectify.Glyph.RectifierT<G>, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, single, fn);
        }
        export function comapAllT<G, X>(
            rec: Rectify.Glyph.RectifierT<G>,
            gm: ReadonlyMap<X, G>,
            fn: (rec: Rectify.Glyph.RectifierT<G>, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, fn, single);
        }
        export function comapSomeT<G, X>(
            rec: Rectify.Glyph.RectifierT<G>,
            gm: ReadonlyMap<X, G>,
            fn: (rec: Rectify.Glyph.RectifierT<G>, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, fn, single);
        }
    }

    export namespace Coord {
        function single<X>(rec: Rectify.Coord.RectifierT<X>, x: X) {
            return rec.coord(x);
        }
        export function list<X>(rec: Rectify.Coord.RectifierT<X>, arr: ReadonlyArray<X>) {
            return RectifyImpl.listSomeT(rec, arr, single);
        }
    }

    export namespace Elim {
        export function findInSet<L>(l: null | undefined | L, ls: ReadonlySet<L>) {
            if (l == null || !ls.has(l)) return null;
            else return l;
        }
        export function findInMap<L>(l: null | undefined | L, ls: ReadonlyMap<L, L>) {
            if (l == null) return null;
            return ls.get(l);
        }
        export function comapSomeT<K, L, A extends any[]>(
            a: ReadonlyMap<K, L>,
            fn: (l: L, ...args: A) => null | undefined | L,
            ...args: A
        ) {
            let a1 = new Map<K, L>();
            for (const [key, value] of a) {
                const l1 = fn(value, ...args);
                if (l1 != null) a1.set(key, l1);
            }
            return a1;
        }
        export function listSomeT<L, A extends any[]>(
            a: ReadonlyArray<L>,
            fn: (l: L, ...args: A) => null | undefined | L,
            ...args: A
        ) {
            let a1: L[] = [];
            for (const item of a) {
                const l1 = fn(item, ...args);
                if (l1 != null) a1.push(l1);
            }
            return a1;
        }
        export function listSome<L>(a: ReadonlyArray<null | undefined | L>, ls: ReadonlySet<L>) {
            let a1: L[] = [];
            for (const item of a) {
                const l1 = findInSet(item, ls);
                if (l1 != null) a1.push(l1);
            }
            return a1;
        }
        export function listSomeOpt<L>(a: ReadonlyArray<null | undefined | L>, ls: ReadonlySet<L>) {
            let a1: L[] = [];
            for (const item of a) {
                const l1 = findInSet(item, ls);
                if (l1 != null) a1.push(l1);
            }
            if (!a1.length) return null;
            return a1;
        }
    }
}
export namespace TraceImpl {
    export namespace Glyph {
        export function Nop<G>(): Trace.Glyph.ProcT<G> {
            return tracer => {};
        }
        export function Seq<G>(from: Iterable<Trace.Glyph.ProcT<G>>): Trace.Glyph.ProcT<G> {
            return tracer => {
                for (const proc of from) proc(tracer);
            };
        }
    }
}
