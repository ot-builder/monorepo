import { OtGlyph } from "../ot-glyph";

export interface PointSink {
    addControlKnot(knot: OtGlyph.Point): void;
}
export interface GeometryProcessor {
    process(geometryList: OtGlyph.Geometry): void;
}
export interface StatGeometryAlg<T> extends GeometryProcessor {
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
export class OtGhPointAlg<PS extends PointSink> implements GeometryProcessor {
    constructor(protected readonly acc: PointTransformer<PS>) {}

    public process(geom: OtGlyph.Geometry) {
        switch (geom.type) {
            case OtGlyph.GeometryType.ContourSet: {
                for (const c of geom.contours) {
                    for (const z of c) {
                        this.acc.addControlKnot(z);
                    }
                }
                break;
            }
            case OtGlyph.GeometryType.TtReference: {
                const plRef = new OtGhPointAlg(
                    this.acc.coWrap(z => OtGlyph.PointOps.applyTransform(z, geom.transform))
                );
                if (geom.to.geometry) plRef.process(geom.to.geometry);
                break;
            }
            case OtGlyph.GeometryType.GeometryList: {
                for (const item of geom.items) this.process(item);
                break;
            }
        }
    }
}
