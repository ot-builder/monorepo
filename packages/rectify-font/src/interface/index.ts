import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";

// RECTIFICATION INTERFACES
export interface GlyphRectifier {
    glyph(from: Ot.Glyph): null | undefined | Ot.Glyph;
}

export interface AxisRectifier {
    axis(axis: Ot.Var.Axis): null | undefined | Ot.Fvar.Axis;
    readonly addedAxes: ReadonlyArray<Ot.Fvar.Axis>;
}

export interface CoordRectifier {
    coord(value: Ot.Var.Value): Ot.Var.Value;
    cv(value: Ot.Var.Value): Ot.Var.Value;
}

export interface LookupRectifierT<L> {
    lookup(l: L): null | undefined | L;
}

////// "Point Attachment" rectifier
export enum PointAttachmentRectifyManner {
    TrustAttachment,
    TrustCoordinate
}
export interface PointAttachmentRectifier {
    readonly manner: PointAttachmentRectifyManner;
    getGlyphPoints(outerGlyph: Ot.Glyph): Data.XY<Ot.Var.Value>[];
    acceptOffset(
        actual: Data.XYOptional<Ot.Var.Value>,
        desired: Data.XYOptional<Ot.Var.Value>
    ): { x: boolean; y: boolean };
}

export interface GlyphTracer {
    has(glyph: Ot.Glyph): boolean;
    add(glyph: Ot.Glyph): void;
}
export type GlyphTraceProc = (tracer: GlyphTracer) => void;
