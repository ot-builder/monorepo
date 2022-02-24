import { OtGlyph } from "../ot-glyph";

import { OtGeometrySink } from "./shared";

export class OtGhFlattener implements OtGeometrySink<OtGlyph.Point[][]> {
    private contours: OtGlyph.Point[][] = [];
    private lastContour: OtGlyph.Point[] = [];
    public getResult() {
        return this.contours;
    }
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
