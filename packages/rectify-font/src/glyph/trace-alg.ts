import { TraceImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Trace } from "@ot-builder/prelude";

type TraceProc = Trace.Glyph.ProcT<Ot.Glyph>;
export function traceGlyphDependents(g: Ot.Glyph): TraceProc {
    return tracer => {
        if (!tracer.has(g)) return;
        if (!g.geometry) return;
        return g.geometry.acceptGeometryAlgebra(new TraceGlyphsAlg())(tracer);
    };
}

class TraceGlyphsAlg implements Ot.Glyph.GeometryAlg<TraceProc> {
    public empty() {
        return TraceImpl.Glyph.Nop();
    }
    public contourSet() {
        return TraceImpl.Glyph.Nop();
    }
    public geometryList(children: TraceProc[]) {
        return TraceImpl.Glyph.Seq(children);
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps): TraceProc {
        return RefProc(ref.to);
    }
}

function RefProc(target: Ot.Glyph) {
    return (tracer: Trace.Glyph.TracerT<Ot.Glyph>) => {
        if (tracer.has(target)) return;
        tracer.add(target);
        if (target.geometry) {
            target.geometry.acceptGeometryAlgebra(new TraceGlyphsAlg())(tracer);
        }
    };
}
