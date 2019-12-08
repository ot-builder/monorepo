import { Algebra } from "@ot-builder/prelude";

import { Transform2X3 } from "./transform-2x3";

export namespace Point {
    export interface T<X> {
        readonly x: X;
        readonly y: X;
        readonly kind: number;
    }

    export interface PointFactoryT<X> {
        create(x: X, y: X, kind: number): T<X>;
    }

    export class OpT<X> implements Algebra.VectorSpace<T<X>, number> {
        public readonly neutral: T<X>;
        constructor(
            private vsX: Algebra.VectorSpace<X, number>,
            private factory: PointFactoryT<X>
        ) {
            this.neutral = factory.create(vsX.neutral, vsX.neutral, 0);
        }

        public add(a: T<X>, b: T<X>) {
            return this.factory.create(this.vsX.add(a.x, b.x), this.vsX.add(a.y, b.y), a.kind);
        }
        public negate(a: T<X>) {
            return this.factory.create(this.vsX.negate(a.x), this.vsX.negate(a.y), a.kind);
        }
        public minus(a: T<X>, b: T<X>) {
            return this.factory.create(this.vsX.minus(a.x, b.x), this.vsX.minus(a.y, b.y), a.kind);
        }
        public scale(s: number, a: T<X>) {
            return this.factory.create(this.vsX.scale(s, a.x), this.vsX.scale(s, a.y), a.kind);
        }
        public addScale(a: T<X>, s: number, b: T<X>) {
            return this.factory.create(
                this.vsX.add(a.x, this.vsX.scale(s, b.x)),
                this.vsX.add(a.y, this.vsX.scale(s, b.y)),
                a.kind
            );
        }
        public applyTransform(a: T<X>, t: Transform2X3.T<X>) {
            if (t.scaledOffset) {
                let x0 = this.vsX.add(a.x, t.dx);
                let y0 = this.vsX.add(a.y, t.dy);
                return this.factory.create(
                    this.vsX.addScale(this.vsX.scale(t.xx, x0), t.yx, y0),
                    this.vsX.addScale(this.vsX.scale(t.xy, x0), t.yy, y0),
                    a.kind
                );
            } else {
                return this.factory.create(
                    this.vsX.addScale(this.vsX.addScale(t.dx, t.xx, a.x), t.yx, a.y),
                    this.vsX.addScale(this.vsX.addScale(t.dy, t.xy, a.x), t.yy, a.y),
                    a.kind
                );
            }
        }
    }

    export type ContourT<X> = ReadonlyArray<T<X>>;
    export type ContourWT<X> = Array<T<X>>;
}

export type PointIDRef = {
    readonly pointIndex: number;
};
export type GlyphPointIDRef<G> = {
    readonly glyph: G;
    readonly pointIndex: number;
};
export type PointRef = {
    readonly geometry: number;
    readonly contour: number;
    readonly index: number;
};
export type PointRefW = {
    geometry: number;
    contour: number;
    index: number;
};
export namespace PointRef {
    export function compare(a: PointRef, b: PointRef) {
        return a.geometry - b.geometry || a.contour - b.contour || a.index - b.index;
    }
}
export type PointAttachment = {
    readonly inner: PointIDRef;
    readonly outer: PointIDRef;
};
