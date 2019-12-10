import { TraceImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Thunk, Trace } from "@ot-builder/prelude";

export function traceLayoutGlyphs(table: Ot.GsubGpos.Table): TraceProc {
    const alg = new TraceGlyphAlg();
    return TraceImpl.Glyph.Seq(table.lookups.map(lookup => lookup.acceptLookupAlgebra(alg)));
}

type TraceProc = Trace.Glyph.ProcT<Ot.Glyph>;
export class TraceGlyphAlg implements Ot.GsubGpos.LookupAlg<TraceProc> {
    public gsubSingle(thProps: Thunk<Ot.Gsub.SingleProp>): TraceProc {
        const props = thProps.force();
        return tracer => {
            for (const [src, dst] of props.mapping) {
                if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
            }
        };
    }
    public gsubMulti(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): TraceProc {
        const props = thProps.force();
        return tracer => {
            for (const [src, dst] of props.mapping.entries()) {
                if (tracer.has(src)) for (const g of dst) if (!tracer.has(g)) tracer.add(g);
            }
        };
    }
    public gsubAlternate(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): TraceProc {
        return this.gsubMulti(thProps);
    }
    public gsubLigature(thProps: Thunk<Ot.Gsub.LigatureProp>): TraceProc {
        const props = thProps.force();
        return tracer => {
            for (const { from, to } of props.mapping) {
                let found = true;
                for (const part of from) if (!tracer.has(part)) found = false;
                if (found && !tracer.has(to)) tracer.add(to);
            }
        };
    }
    public gsubReverse(thProps: Thunk<Ot.Gsub.ReverseSubProp>): TraceProc {
        const props = thProps.force();
        return tracer => {
            for (const rule of props.rules) {
                for (const [src, dst] of rule.replacement) {
                    if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
                }
            }
        };
    }
    public gposSingle(): TraceProc {
        return tracer => {};
    }
    public gposPair(): TraceProc {
        return tracer => {};
    }
    public gposCursive(): TraceProc {
        return tracer => {};
    }
    public gposMarkToBase(): TraceProc {
        return tracer => {};
    }
    public gposMarkToMark(): TraceProc {
        return tracer => {};
    }
    public gposMarkToLigature(): TraceProc {
        return tracer => {};
    }
    public gsubChaining(): TraceProc {
        return tracer => {};
    }
    public gposChaining(): TraceProc {
        return tracer => {};
    }
}
