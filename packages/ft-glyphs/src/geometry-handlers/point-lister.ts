import { OtGlyph } from "../ot-glyph";

import { OtGhPointHandlerT, PointTransformer } from "./shared";

export class OtGhPointLister extends OtGhPointHandlerT<PointCollector> {
    constructor() {
        super(new PointTransformer(new PointCollector(), z => z));
    }
    public getResult() {
        return this.acc.ps.points;
    }
}

class PointCollector {
    public points: OtGlyph.Point[] = [];
    public addControlKnot(knot: OtGlyph.Point) {
        this.points.push(knot);
    }
}
