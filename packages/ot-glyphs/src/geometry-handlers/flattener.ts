import { OtGlyph } from "../ot-glyph";

import { OtGhPointAlg, PointTransformer } from "./shared";

export class OtGhFlattener extends OtGhPointAlg<ContoursCollector> {
    constructor() {
        super(new PointTransformer(new ContoursCollector(), OtGlyph.Transform2X3.Identity));
    }
    public getResult() {
        return this.acc.ps.contours;
    }
}

class ContoursCollector {
    public contours: OtGlyph.Point[][] = [];
    private lastContour: OtGlyph.Point[] = [];
    public beginContour() {
        this.lastContour = [];
    }
    public endContour() {
        if (this.lastContour.length) this.contours.push(this.lastContour);
    }
    public addControlKnot(knot: OtGlyph.Point) {
        this.lastContour.push(knot);
    }
}
