import { Algebra } from "@ot-builder/prelude";

import * as Transform2X3 from "../transform-2x3";

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
    constructor(private vsX: Algebra.VectorSpace<X, number>, private factory: PointFactoryT<X>) {
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
            const x0 = this.vsX.add(a.x, t.dx);
            const y0 = this.vsX.add(a.y, t.dy);
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

    public removeScaledOffset(t: Transform2X3.T<X>): Transform2X3.T<X> {
        // ⎛ xx yx ⎞ ⎛ x + dx ⎞ = ⎛ xx yx ⎞ ⎛ x ⎞ + ⎛ xx yx ⎞ ⎛ x ⎞
        // ⎝ xy yy ⎠ ⎝ y + dy ⎠ = ⎝ xy yy ⎠ ⎝ y ⎠ + ⎝ xy yy ⎠ ⎝ y ⎠
        if (!t.scaledOffset) return t;

        return {
            xx: t.xx,
            yx: t.yx,
            xy: t.xy,
            yy: t.yy,
            dx: this.vsX.addScale(this.vsX.scale(t.xx, t.dx), t.yx, t.dy),
            dy: this.vsX.addScale(this.vsX.scale(t.xy, t.dx), t.yy, t.dy)
        };
    }

    public combineTransform(_a: Transform2X3.T<X>, _b: Transform2X3.T<X>): Transform2X3.T<X> {
        // ⎛ a.xx a.yx ⎞ ⎡⎛ b.xx b.yx ⎞ ⎛ x ⎞ + ⎛ b.dx ⎞⎤ + ⎛ a.dx ⎞
        // ⎝ a.xy a.yy ⎠ ⎣⎝ b.xy b.yy ⎠ ⎝ y ⎠ + ⎝ b.dy ⎠⎦ + ⎝ a.dy ⎠
        // == ⎛ a.xx a.yx ⎞ ⎛ b.xx b.yx ⎞ ⎛ x ⎞ + ⎡⎛ a.xx a.yx ⎞ ⎛ b.dx ⎞ + ⎛ a.dx ⎞⎤
        // == ⎝ a.xy a.yy ⎠ ⎝ b.xy b.yy ⎠ ⎝ y ⎠ + ⎣⎝ a.xy a.yy ⎠ ⎝ b.dy ⎠ + ⎝ a.dy ⎠⎦

        const a = this.removeScaledOffset(_a),
            b = this.removeScaledOffset(_b);

        return {
            xx: a.xx * b.xx + a.yx * b.xy,
            yx: a.xx * b.yx + a.yx * b.yy,
            xy: a.xy * b.xx + a.yy * b.xy,
            yy: a.xy * b.yx + a.yy * b.yy,
            dx: this.vsX.addScale(this.vsX.addScale(a.dx, a.xx, b.dx), a.yx, b.dy),
            dy: this.vsX.addScale(this.vsX.addScale(a.dy, a.xy, b.dx), a.yy, b.dy)
        };
    }
}

export type ContourT<X> = ReadonlyArray<T<X>>;
export type ContourWT<X> = Array<T<X>>;
