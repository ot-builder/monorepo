import { OV } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

import { OtGhPointHandlerT, PointTransformer } from "./shared";

export class OtGhGetBound extends OtGhPointHandlerT<BoundBoxPointSink> {
    constructor() {
        super(new PointTransformer(new BoundBoxPointSink(), z => z));
    }
    public getResult() {
        return this.acc.ps.getBound();
    }
}

class BoundBoxPointSink {
    private bb = new OtGlyph.Stat.BoundingBoxBuilder();
    public getBound() {
        return this.bb.getResult();
    }
    public addControlKnot(knot: OtGlyph.Point) {
        this.bb.addPoint(OV.originOf(knot.x), OV.originOf(knot.y));
    }
}
