import * as Ot from "@ot-builder/ot";

// RECTIFICATION INTERFACES
export interface GlyphReferenceRectifier {
    glyphRef(from: Ot.Glyph): null | undefined | Ot.Glyph;
}

export interface AxisRectifier {
    dim(dim: Ot.Var.Dim): null | undefined | Ot.Var.Dim;
    axis(axis: Ot.Fvar.Axis): null | undefined | Ot.Fvar.Axis;
    readonly addedAxes: ReadonlyArray<Ot.Fvar.Axis>;
}

export interface CoordRectifier {
    coord(value: Ot.Var.Value): Ot.Var.Value;
    cv(value: Ot.Var.Value): Ot.Var.Value;
}

////// "Point Attachment" rectifier
export enum PointAttachmentRectifyManner {
    TrustAttachment,
    TrustCoordinate
}
export interface PointAttachmentRectifier {
    readonly manner: PointAttachmentRectifyManner;
    acceptOffset(
        actual: { x: Ot.Var.Value; y: Ot.Var.Value },
        desired: { x: Ot.Var.Value; y: Ot.Var.Value }
    ): { x: boolean; y: boolean };
}

export const IdGlyphRefRectifier: GlyphReferenceRectifier = { glyphRef: g => g };
export const IdAxisRectifier: AxisRectifier = { dim: a => a, axis: a => a, addedAxes: [] };
export const IdCoordRectifier: CoordRectifier = { coord: x => x, cv: x => x };
export const IdPointAttachmentRectifier: PointAttachmentRectifier = {
    manner: PointAttachmentRectifyManner.TrustAttachment,
    acceptOffset: () => ({ x: true, y: true })
};
