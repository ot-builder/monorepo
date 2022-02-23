import * as Ot from "@ot-builder/ot";
import { OtGeometryHandler } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { CoordRectifier, GlyphReferenceRectifier } from "../interface";

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
    export function maybe2T<R1, R2, X>(
        rec1: R1,
        rec2: R2,
        x: null | undefined | X,
        fn: (rec1: R1, rec2: R2, x: X) => null | undefined | X
    ) {
        if (!x) return x;
        else return fn(rec1, rec2, x);
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
    export function listAll2T<R1, R2, X>(
        rectifier1: R1,
        rectifier2: R2,
        m: ReadonlyArray<X>,
        fn: (r1: R1, r2: R2, x: X) => null | undefined | X
    ) {
        const m1: X[] = [];
        for (const x of m) {
            const x1 = fn(rectifier1, rectifier2, x);
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
    export function listSome2T<R1, R2, X>(
        rectifier1: R1,
        rectifier2: R2,
        m: ReadonlyArray<X>,
        fn: (re: R1, re2: R2, x: X) => null | undefined | X
    ) {
        const m1: X[] = [];
        for (const x of m) {
            const x1 = fn(rectifier1, rectifier2, x);
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
    export function mapAllT2<R, X, Y>(
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
    export function bimapSomeT<R1, R2, X, Y>(
        rectifier1: R1,
        rectifier2: R2,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R1, x: X) => null | undefined | X,
        fnY: (re: R2, y: Y) => null | undefined | Y
    ) {
        const m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier1, x);
            if (x1 == null) continue;
            const y1 = fnY(rectifier2, y);
            if (y1 == null) continue;
            m1.set(x1, y1);
        }
        return m1;
    }
    export function bimapSome2T<R1, R2, X, Y>(
        rectifier1: R1,
        rectifier2: R2,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R1, x: X) => null | undefined | X,
        fnY: (r1: R1, r2: R2, y: Y) => null | undefined | Y
    ) {
        const m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier1, x);
            if (x1 == null) continue;
            const y1 = fnY(rectifier1, rectifier2, y);
            if (y1 == null) continue;
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
        return bimapSomeT(rectifier, rectifier, m, fnX, fnY);
    }
    export function bimapSomeT2<R1, R2, X, Y>(
        rectifier1: R1,
        rectifier2: R2,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R1, x: X) => null | undefined | X,
        fnY: (re: R2, x1: X, y: Y) => null | undefined | Y
    ) {
        const m1 = new Map<X, Y>();
        for (const [x, y] of m) {
            const x1 = fnX(rectifier1, x);
            if (x1 == null) continue;
            const y1 = fnY(rectifier2, x1, y);
            if (y1 == null) continue;
            m1.set(x1, y1);
        }
        return m1;
    }
    export function mapSomeT2<R, X, Y>(
        rectifier: R,
        m: ReadonlyMap<X, Y>,
        fnX: (re: R, x: X) => null | undefined | X,
        fnY: (re: R, x1: X, y: Y) => null | undefined | Y
    ) {
        return bimapSomeT2(rectifier, rectifier, m, fnX, fnY);
    }

    export namespace Glyph {
        export function single(rectifier: GlyphReferenceRectifier, g: Ot.Glyph) {
            return rectifier.glyphRef(g);
        }
        export function setAll(rec: GlyphReferenceRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setAllT(rec, gs, single);
        }
        export function setSome(rec: GlyphReferenceRectifier, gs: ReadonlySet<Ot.Glyph>) {
            return RectifyImpl.setSomeT(rec, gs, single);
        }
        export function setSomeN(
            rec: GlyphReferenceRectifier,
            gs: Data.Maybe<ReadonlySet<Ot.Glyph>>
        ) {
            if (!gs) return null;
            const gs1 = RectifyImpl.setSomeT(rec, gs, single);
            if (!gs1.size) return null;
            else return gs1;
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
        export function mapAllTX<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, single, fn);
        }
        export function mapSomeTX<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapSomeT(rec, gm, single, fn);
        }
        export function mapSomeTY<R2, X>(
            rec: GlyphReferenceRectifier,
            rec2: R2,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec: R2, x: X) => null | undefined | X
        ) {
            return RectifyImpl.bimapSomeT(rec, rec2, gm, single, fn);
        }
        export function mapSomeTY2<R2, X>(
            rec: GlyphReferenceRectifier,
            rec2: R2,
            gm: ReadonlyMap<Ot.Glyph, X>,
            fn: (rec1: GlyphReferenceRectifier, rec2: R2, x: X) => null | undefined | X
        ) {
            return RectifyImpl.bimapSome2T(rec, rec2, gm, single, fn);
        }
        export function comapAllTY<X>(
            rec: GlyphReferenceRectifier,
            gm: ReadonlyMap<X, Ot.Glyph>,
            fn: (rec: GlyphReferenceRectifier, x: X) => null | undefined | X
        ) {
            return RectifyImpl.mapAllT(rec, gm, fn, single);
        }
        export function comapSomeTY<X>(
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
        export function list(
            rec: CoordRectifier,
            arr: ReadonlyArray<Ot.Var.Value>
        ): Ot.Var.Value[] {
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
        return OtGeometryHandler.apply(OtGeometryHandler.ListPoint, g.geometry);
    }
}
