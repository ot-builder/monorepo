import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

export enum PointType {
    Corner = 0,
    Lead = 1,
    Follow = 2,
    Quad = 3
}
export class CPoint implements GeneralGlyph.Point.T<OtVar.Value> {
    constructor(public x: OtVar.Value, public y: OtVar.Value, public kind: number) {}
    public static create(x: OtVar.Value, y: OtVar.Value, kind: number = PointType.Corner) {
        return new CPoint(x || 0, y || 0, kind);
    }
}
export const PointOps = new GeneralGlyph.Point.OpT(OtVar.Ops, CPoint);
export type Contour = GeneralGlyph.Contour.T<OtVar.Value>;
