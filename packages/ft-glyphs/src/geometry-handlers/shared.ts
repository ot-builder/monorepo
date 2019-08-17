import { OtGlyph } from "../ot-glyph";

export interface PointSink {
    addControlKnot(knot: OtGlyph.Point): void;
}

export interface StatGeometrySink<T> extends OtGlyph.GeometrySink {
    getResult(): T;
}
export interface StatGeometrySinkClass<T> {
    new (): StatGeometrySink<T>;
}

export class PointTransformer<PS extends PointSink> {
    constructor(readonly ps: PS, readonly tf: (z: OtGlyph.Point) => OtGlyph.Point) {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.ps.addControlKnot(this.tf(knot));
    }
    public wrap(tf1: (z: OtGlyph.Point) => OtGlyph.Point) {
        const tf = this.tf;
        return new PointTransformer<PS>(this.ps, z => tf1(tf(z)));
    }
    public coWrap(tf1: (z: OtGlyph.Point) => OtGlyph.Point) {
        const tf = this.tf;
        return new PointTransformer<PS>(this.ps, z => tf(tf1(z)));
    }
}

export class OtGhPointHandlerT<PS extends PointSink> implements OtGlyph.GeometrySink {
    constructor(protected readonly acc: PointTransformer<PS>) {}
    public addReference(ref: OtGlyph.Reference) {
        const plRef = new OtGhPointHandlerT(
            this.acc.coWrap(z => OtGlyph.PointOps.applyTransform(z, ref.transform))
        );
        ref.to.transfer(plRef);
    }
    public addContourSet() {
        return new ContourSetHandler(this.acc);
    }
}

class ContourSetHandler<PS extends PointSink> implements OtGlyph.ContourSink {
    constructor(private readonly acc: PointTransformer<PS>) {}
    public begin() {}
    public addContour() {
        return new ContourHandler(this.acc);
    }
    public end() {}
}

class ContourHandler<PS extends PointSink> implements OtGlyph.PrimitiveSink {
    constructor(private readonly acc: PointTransformer<PS>) {}
    public begin() {}
    public end() {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.acc.addControlKnot(knot);
    }
}
