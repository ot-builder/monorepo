import { OtGlyph } from "../ot-glyph";

import { OtGhPointAlg, PointTransformer } from "./shared";

export class OtGhCountPoint extends OtGhPointAlg<PointCount> {
    constructor() {
        super(new PointTransformer(new PointCount(), OtGlyph.Transform2X3.Identity));
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
