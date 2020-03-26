import * as Ot from "@ot-builder/ot";
import { OtGeometryHandler } from "@ot-builder/ot-glyphs";

import { CoordRectifier, GlyphReferenceRectifier, GlyphTraceProc } from "../interface";

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
        const xs1: Set<X> = new Set();
        for (const x of xs) {
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
        const xs1: Set<X> = new Set();
        for (const x of xs) {
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
        const m1: X[] = [];
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
        const m1: X[] = [];
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
        const m1: Array<null | undefined | X> = [];
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
        const m1 = new Map<X, Y>();
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
        const m1 = new Map<X, Y>();
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
        const m1 = new Map<X, Y>();
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
        const m1 = new Map<X, Y>();
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
        function single(rectifier: GlyphReferenceRectifier, g: Ot.Glyph) {
            return rectifier.glyphRef(g);
        }
        export function setAll(rec: GlyphReferenceRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setAllT(rec, gs, single);
        }
        export function setSome(rec: GlyphReferenceRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setSomeT(rec, gs, single);
        }
        export function listAll(rec: GlyphReferenceRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listAllT(rec, gs, single);
        }
        export function listSome(rec: GlyphReferenceRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listSomeT(rec, gs, single);
        }
        export function listSparse(rec: GlyphReferenceRectifier, gs: ReadonlyArray<Ot.Glyph>) {
            return RectifyImpl.listSparseT(rec, gs, single);
        }
        export function bimapAll(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, Ot.Glyph>
        ) {
            return RectifyImpl.mapAllT(rec, gm, single, single);
        }
        export function bimapSome(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, Ot.Glyph>
        ) {
            return RectifyImpl.mapSomeT(rec, gm, single, single);
        }
        export function mapAll<X>(rec: GlyphReferenceRectifier, gm: ReadonlyMap<Ot.Glyph, X>) {
            return RectifyImpl.mapAllT(rec, gm, single, (r, x) => x);
        }
        export function mapSome<X>(rec: GlyphReferenceRectifier, gm: ReadonlyMap<Ot.Glyph, X>) {
            return RectifyImpl.mapSomeT(rec, gm, single, (r, x) => x);
        }
        export function comapAll<X>(rec: GlyphReferenceRectifier, gm: ReadonlyMap<X, Ot.Glyph>) {
            return RectifyImpl.mapAllT(rec, gm, (r, x) => x, single);
        }
        export function comapSome<X>(rec: GlyphReferenceRectifier, gm: ReadonlyMap<X, Ot.Glyph>) {
            return RectifyImpl.mapSomeT(rec, gm, (r, x) => x, single);
        }
        export function mapAllT<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, single, fn);
        }
        export function mapSomeT<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, single, fn);
        }
        export function comapAllT<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<X, Ot.Glyph>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, fn, single);
        }
        export function comapSomeT<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<X, Ot.Glyph>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
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
        export function comapSomeT<K, L, A extends unknown[]>(
            a: ReadonlyMap<K, L>,
            fn: (l: L, ...args: A) => null | undefined | L,
            ...args: A
        ) {
            const a1 = new Map<K, L>();
            for (const [key, value] of a) {
                const l1 = fn(value, ...args);
                if (l1 != null) a1.set(key, l1);
            }
            return a1;
        }
        export function listSomeT<L, A extends unknown[]>(
            a: ReadonlyArray<L>,
            fn: (l: L, ...args: A) => null | undefined | L,
            ...args: A
        ) {
            const a1: L[] = [];
            for (const item of a) {
                const l1 = fn(item, ...args);
                if (l1 != null) a1.push(l1);
            }
            return a1;
        }
        export function listSome<L>(a: ReadonlyArray<null | undefined | L>, ls: ReadonlySet<L>) {
            const a1: L[] = [];
            for (const item of a) {
                const l1 = findInSet(item, ls);
                if (l1 != null) a1.push(l1);
            }
            return a1;
        }
        export function listSomeOpt<L>(
            a: ReadonlyArray<null | undefined | L>,
            ls: ReadonlySet<L>
        ) {
            const a1: L[] = [];
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
