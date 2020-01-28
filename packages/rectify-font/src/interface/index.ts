import * as Ot from "@ot-builder/font";

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

export interface GlyphTracer {
    readonly size: number;
    has(glyph: Ot.Glyph): boolean;
    add(glyph: Ot.Glyph): void;
}
export type GlyphTraceProc = (tracer: GlyphTracer) => void;
