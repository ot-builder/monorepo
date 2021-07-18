import * as Ot from "@ot-builder/ot";

import { GlyphTraceProc } from "../interface";

import * as TraceImpl_Glyph from "./trace-impl/glyph";

export function traceMath(table: Ot.Math.Table): GlyphTraceProc {
    if (!table.variants) return TraceImpl_Glyph.Nop;
    const procs: GlyphTraceProc[] = [];
    if (table.variants.vertical)
        for (const [from, to] of table.variants.vertical)
            procs.push(traceGlyphConstruction(from, to));
    if (table.variants.horizontal)
        for (const [from, to] of table.variants.horizontal)
            procs.push(traceGlyphConstruction(from, to));
    return TraceImpl_Glyph.Seq(procs);
}

function traceGlyphConstruction(from: Ot.Glyph, to: Ot.Math.GlyphConstruction): GlyphTraceProc {
    return tracer => {
        if (!tracer.has(from)) return;
        if (to.assembly) {
            for (const part of to.assembly.parts) tracer.add(part.partGlyph);
            for (const variant of to.variants) tracer.add(variant.variantGlyph);
        }
    };
}
