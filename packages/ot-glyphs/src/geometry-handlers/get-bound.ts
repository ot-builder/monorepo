import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";
import { BoundingBox } from "../ot-glyph/stat";

import { OtGeometrySink } from "./shared";

export class OtGhGetBound implements OtGeometrySink<BoundingBox> {
    private bb = new OtGlyph.Stat.BoundingBoxBuilder();
    public getResult() {
        return this.bb.getResult();
    }
    public beginContour() {}
    public endContour() {}
    public addControlKnot(knot: OtGlyph.Point) {
        this.bb.addPoint(OtVar.Ops.originOf(knot.x), OtVar.Ops.originOf(knot.y));
    }
}
