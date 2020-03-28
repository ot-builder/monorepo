import { GlyphTraceProc } from "../interface";

export namespace TraceImpl {
    export namespace Glyph {
        export function Nop(): GlyphTraceProc {
            return tracer => {};
        }
        export function Seq(from: Iterable<GlyphTraceProc>): GlyphTraceProc {
            return tracer => {
                for (const proc of from) proc(tracer);
            };
        }
    }
}
