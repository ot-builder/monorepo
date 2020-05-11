import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

import { OtGhPointAlg, PointTransformer } from "./shared";

export class OtGhGetBound extends OtGhPointAlg<BoundBoxPointSink> {
    constructor() {
        super(new PointTransformer(new BoundBoxPointSink(), OtGlyph.Transform2X3.Identity));
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
        this.bb.addPoint(OtVar.Ops.originOf(knot.x), OtVar.Ops.originOf(knot.y));
    }
}
