import { Rectify } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

import { OtGhPointLister } from "./point-lister";

export class OtGhStdPointAttachRectifier
    implements Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value> {
    constructor(readonly manner: Rectify.PointAttach.Manner, readonly error = 1 / 16) {}

    public getGlyphPoint(g: OtGlyph, zid: number): null | Rectify.PointAttach.XYFT<OtVar.Value> {
        const lister = new OtGhPointLister();
        g.visitGeometry(lister);
        const points = lister.getResult();
        return points[zid];
    }

    public acceptOffset(
        actual: Rectify.PointAttach.XYT<OtVar.Value>,
        desired: Rectify.PointAttach.XYT<OtVar.Value>
    ) {
        let xSame = OtVar.Ops.equal(actual.x || 0, desired.x || 0, this.error);
        let ySame = OtVar.Ops.equal(actual.y || 0, desired.y || 0, this.error);
        return { x: xSame, y: ySame };
    }
}
