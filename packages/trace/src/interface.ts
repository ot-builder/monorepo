import * as Ot from "@ot-builder/ot";

export interface GlyphTracer {
    readonly size: number;
    has(glyph: Ot.Glyph): boolean;
    add(glyph: Ot.Glyph): void;
}
export type GlyphTraceProc = (tracer: GlyphTracer) => void;
