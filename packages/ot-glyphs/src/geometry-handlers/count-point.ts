import { OtGlyph } from "../ot-glyph";

import { OtGeometrySink } from "./shared";

export class OtGhCountPoint implements OtGeometrySink<number> {
    private pc = 0;
    public getResult() {
        return this.pc;
    }
    public beginContour() {}
    public endContour() {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.pc++;
    }
}
