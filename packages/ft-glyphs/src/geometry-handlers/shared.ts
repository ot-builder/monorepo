import { OtGlyph } from "../ot-glyph";

export interface PointSink {
    addControlKnot(knot: OtGlyph.Point): void;
}

export interface StatGeometryAlg<T> extends OtGlyph.GeometryAlg<void> {
    getResult(): T;
}
export interface StatGeometryAlgClass<T> {
    new (): StatGeometryAlg<T>;
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
export class OtGhPointAlg<PS extends PointSink> implements OtGlyph.GeometryAlg<void> {
    constructor(protected readonly acc: PointTransformer<PS>) {}
    public empty() {}
    public contourSet(cs: OtGlyph.ContourSetProps) {
        for (const c of cs.contours) {
            for (const z of c) {
                this.acc.addControlKnot(z);
            }
        }
    }
    public geometryList(parts: void[]) {}
    public ttReference(ref: OtGlyph.TtReferenceProps) {
        const plRef = new OtGhPointAlg(
            this.acc.coWrap(z => OtGlyph.PointOps.applyTransform(z, ref.transform))
        );
        if (ref.to.geometry) ref.to.geometry.apply(plRef);
    }
}
