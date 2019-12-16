import * as Ot from "@ot-builder/font";
import { OtGeometryHandler } from "@ot-builder/ft-glyphs";

import { CoordRectifier, GlyphRectifier, GlyphTraceProc } from "../interface";

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
        function single(rectifier: GlyphRectifier, g: Ot.Glyph) {
            return rectifier.glyph(g);
        }
        export function setAll(rec: GlyphRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setAllT(rec, gs, single);
        }
        export function setSome(rec: GlyphRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setSomeT(rec, gs, single);
        }
        export function listAll(rec: GlyphRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listAllT(rec, gs, single);
        }
        export function listSome(rec: GlyphRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listSomeT(rec, gs, single);
        }
        export function listSparse(rec: GlyphRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listSparseT(rec, gs, single);
        }
        export function bimapAll(rec: GlyphRectifier, gm: ReadonlyMap<Ot.Glyph, Ot.Glyph>) {
            return RectifyImpl.mapAllT(rec, gm, single, single);
        }
        export function bimapSome(rec: GlyphRectifier, gm: ReadonlyMap<Ot.Glyph, Ot.Glyph>) {
            return RectifyImpl.mapSomeT(rec, gm, single, single);
        }
        export function mapAll<X>(rec: GlyphRectifier, gm: ReadonlyMap<Ot.Glyph, X>) {
            return RectifyImpl.mapAllT(rec, gm, single, (r, x) => x);
        }
        export function mapSome<X>(rec: GlyphRectifier, gm: ReadonlyMap<Ot.Glyph, X>) {
            return RectifyImpl.mapSomeT(rec, gm, single, (r, x) => x);
        }
        export function comapAll<X>(rec: GlyphRectifier, gm: ReadonlyMap<X, Ot.Glyph>) {
            return RectifyImpl.mapAllT(rec, gm, (r, x) => x, single);
        }
        export function comapSome<X>(rec: GlyphRectifier, gm: ReadonlyMap<X, Ot.Glyph>) {
            return RectifyImpl.mapSomeT(rec, gm, (r, x) => x, single);
        }
        export function mapAllT<X>(
            rec: GlyphRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, single, fn);
        }
        export function mapSomeT<X>(
            rec: GlyphRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, single, fn);
        }
        export function comapAllT<X>(
            rec: GlyphRectifier,
            gm: ReadonlyMap<X, Ot.Glyph>,
            fn: (rec: GlyphRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, fn, single);
        }
        export function comapSomeT<X>(
            rec: GlyphRectifier,
            gm: ReadonlyMap<X, Ot.Glyph>,
            fn: (rec: GlyphRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, fn, single);
        }
    }

    export namespace Coord {
        function single(rec: CoordRectifier, x: Ot.Var.Value) {
            return rec.coord(x);
        }
        export function list(rec: CoordRectifier, arr: ReadonlyArray<Ot.Var.Value>) {
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

    export function getGlyphPoints(g: Ot.Glyph) {
        return OtGeometryHandler.stat(OtGeometryHandler.ListPoint, g.geometry);
    }
}
export namespace TraceImpl {
    export namespace Glyph {
        export function Nop(): GlyphTraceProc {
            return tracer => {};
        }
        export function Seq(from: Iterable<GlyphTraceProc>): GlyphTraceProc {
            return tracer => {
                for (const proc of from) proc(tracer);
            };
        }
    }
}
