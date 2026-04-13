import type { OtGlyph } from "../ot-glyph";

import type { OtGeometrySink } from "./shared";

export class OtGhPointLister implements OtGeometrySink<OtGlyph.Point[]> {
    public points: OtGlyph.Point[] = [];
    public getResult() {
        return this.points;
    }
    public beginContour() {}
    public endContour() {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.points.push(knot);
    }
}
