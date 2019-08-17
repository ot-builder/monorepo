import { OtGlyph } from "../ot-glyph";

import { OtGhPointHandlerT, PointTransformer } from "./shared";

export class OtGhCountPoint extends OtGhPointHandlerT<PointCount> {
    constructor() {
        super(new PointTransformer(new PointCount(), z => z));
    }
    public getResult() {
        return this.acc.ps.getResult();
    }
}

class PointCount {
    private pc = 0;
    public getResult() {
        return this.pc;
    }
    public addControlKnot(knot: OtGlyph.Point) {
        this.pc++;
    }
}
