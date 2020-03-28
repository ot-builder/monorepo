import * as Ot from "@ot-builder/ot";

import { GlyphTraceProc, GlyphTracer } from "../interface";

import { TraceImpl } from "./shared";

export function traceGlyphDependents(g: Ot.Glyph): GlyphTraceProc {
    return tracer => {
        if (!tracer.has(g)) return;
        if (!g.geometry) return;
        return new TraceGlyphsAlg().process(g.geometry)(tracer);
    };
}

class TraceGlyphsAlg {
    public process(geom: Ot.Glyph.Geometry): GlyphTraceProc {
        switch (geom.type) {
            case Ot.Glyph.GeometryType.ContourSet:
                return this.contourSet(geom);
            case Ot.Glyph.GeometryType.GeometryList:
                return this.geometryList(geom.items.map(item => this.process(item)));
            case Ot.Glyph.GeometryType.TtReference:
                return this.ttReference(geom);
        }
    }
    public contourSet(geom: Ot.Glyph.ContourSetProps) {
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
            new TraceGlyphsAlg().process(target.geometry)(tracer);
        }
    };
}
