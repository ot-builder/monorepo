import { OtGlyph } from "../ot-glyph";

import { OtGhPointAlg, PointTransformer } from "./shared";

export class OtGhPointLister extends OtGhPointAlg<PointCollector> {
    constructor() {
        super(new PointTransformer(new PointCollector(), OtGlyph.Transform2X3.Identity));
    }
    public getResult() {
        return this.acc.ps.points;
    }
}

class PointCollector {
    public points: OtGlyph.Point[] = [];
    public beginContour() {}
    public endContour() {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.points.push(knot);
    }
}
