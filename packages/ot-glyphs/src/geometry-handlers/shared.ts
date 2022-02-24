import { OtGlyph } from "../ot-glyph";

export interface OtGeometrySinkClass<T> {
    new (): OtGeometrySink<T>;
}
export interface OtGeometrySink<T> {
    beginContour(): void;
    addControlKnot(knot: OtGlyph.Point): void;
    endContour(): void;
    getResult(): T;
}

class OtTransformedGeometrySink<T> implements OtGeometrySink<T> {
    constructor(
        private readonly sink: OtGeometrySink<T>,
        private readonly transform: OtGlyph.Transform2X3
    ) {}
    public beginContour() {
        this.sink.beginContour();
    }
    public addControlKnot(knot: OtGlyph.Point) {
        this.sink.addControlKnot(OtGlyph.PointOps.applyTransform(knot, this.transform));
    }
    public endContour() {
        this.sink.endContour();
    }
    public getResult(): T {
        return this.sink.getResult();
    }
}

export class OtGeometryTraverse<T> {
    constructor(protected readonly sink: OtGeometrySink<T>) {}

    public process(geom: OtGlyph.Geometry) {
        switch (geom.type) {
            case OtGlyph.GeometryType.ContourSet: {
                for (const c of geom.contours) {
                    this.sink.beginContour();
                    for (const z of c) {
                        this.sink.addControlKnot(z);
                    }
                    this.sink.endContour();
                }
                break;
            }
            case OtGlyph.GeometryType.TtReference: {
                const sub = new OtGeometryTraverse(
                    new OtTransformedGeometrySink(this.sink, geom.transform)
                );
                if (geom.to.geometry) sub.process(geom.to.geometry);
                break;
            }
            case OtGlyph.GeometryType.GeometryList: {
                for (const item of geom.items) this.process(item);
                break;
            }
        }
    }
}
