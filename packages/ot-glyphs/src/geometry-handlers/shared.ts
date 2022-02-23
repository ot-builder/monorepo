import { OtGlyph } from "../ot-glyph";

export interface PointSink {
    beginContour(): void;
    addControlKnot(knot: OtGlyph.Point): void;
    endContour(): void;
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
    constructor(public readonly ps: PS, public readonly tf: OtGlyph.Transform2X3) {}
    public beginContour() {
        this.ps.beginContour();
    }
    public addControlKnot(knot: OtGlyph.Point) {
        this.ps.addControlKnot(OtGlyph.PointOps.applyTransform(knot, this.tf));
    }
    public endContour() {
        this.ps.endContour();
    }
    public wrap(tf1: OtGlyph.Transform2X3) {
        return new PointTransformer<PS>(this.ps, OtGlyph.PointOps.combineTransform(tf1, this.tf));
    }
    public coWrap(tf1: OtGlyph.Transform2X3) {
        return new PointTransformer<PS>(this.ps, OtGlyph.PointOps.combineTransform(this.tf, tf1));
    }
}

export class OtGhPointAlg<PS extends PointSink> implements GeometryProcessor {
    constructor(protected readonly acc: PointTransformer<PS>) {}

    public process(geom: OtGlyph.Geometry) {
        switch (geom.type) {
            case OtGlyph.GeometryType.ContourSet: {
                for (const c of geom.contours) {
                    this.acc.beginContour();
                    for (const z of c) {
                        this.acc.addControlKnot(z);
                    }
                    this.acc.endContour();
                }
                break;
            }
            case OtGlyph.GeometryType.TtReference: {
                const inner = new OtGhPointAlg(this.acc.coWrap(geom.transform));
                if (geom.to.geometry) inner.process(geom.to.geometry);
                break;
            }
            case OtGlyph.GeometryType.GeometryList: {
                for (const item of geom.items) this.process(item);
                break;
            }
        }
    }
}
