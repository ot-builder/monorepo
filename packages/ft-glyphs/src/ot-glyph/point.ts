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

export type PointIDRef = {
    readonly pointIndex: number;
};
export type GlyphPointIDRef<G> = {
    readonly glyph: G;
    readonly pointIndex: number;
};
export type PointRef = {
    readonly geometry: number;
    readonly contour: number;
    readonly index: number;
};
export type PointRefW = {
    geometry: number;
    contour: number;
    index: number;
};
export namespace PointRef {
    export function compare(a: PointRef, b: PointRef) {
        return a.geometry - b.geometry || a.contour - b.contour || a.index - b.index;
    }
}
export type PointAttachment = {
    readonly inner: PointIDRef;
    readonly outer: PointIDRef;
};
