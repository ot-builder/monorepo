import * as Ot from "@ot-builder/font";

import { GlyphTraceProc, GlyphTracer } from "../interface";
import { TraceImpl } from "../shared";

export function traceGlyphDependents(g: Ot.Glyph): GlyphTraceProc {
    return tracer => {
        if (!tracer.has(g)) return;
        if (!g.geometry) return;
        return g.geometry.apply(new TraceGlyphsAlg())(tracer);
    };
}

class TraceGlyphsAlg implements Ot.Glyph.GeometryAlg<GlyphTraceProc> {
    public empty() {
        return TraceImpl.Glyph.Nop();
    }
    public contourSet() {
        return TraceImpl.Glyph.Nop();
    }
    public geometryList(children: GlyphTraceProc[]) {
        return TraceImpl.Glyph.Seq(children);
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps): GlyphTraceProc {
        return RefProc(ref.to);
    }
}

function RefProc(target: Ot.Glyph) {
    return (tracer: GlyphTracer) => {
        if (tracer.has(target)) return;
        tracer.add(target);
        if (target.geometry) {
            target.geometry.apply(new TraceGlyphsAlg())(tracer);
        }
    };
}
