import * as Ot from "@ot-builder/font";
import { Thunk } from "@ot-builder/prelude";

import { GlyphTraceProc } from "../../interface";
import { TraceImpl } from "../../shared";

export function traceGsub(table: Ot.Gsub.Table): GlyphTraceProc {
    const alg = new TraceGlyphAlg();
    return TraceImpl.Glyph.Seq(table.lookups.map(lookup => lookup.apply(alg)));
}

export function traceGpos(table: Ot.Gpos.Table): GlyphTraceProc {
    const alg = new TraceGlyphAlg();
    return TraceImpl.Glyph.Seq(table.lookups.map(lookup => lookup.apply(alg)));
}

export class TraceGlyphAlg
    implements Ot.Gsub.LookupAlg<GlyphTraceProc>, Ot.Gpos.LookupAlg<GlyphTraceProc> {
    public gsubSingle(thProps: Thunk<Ot.Gsub.SingleProp>): GlyphTraceProc {
        const props = thProps.force();
        return tracer => {
            for (const [src, dst] of props.mapping) {
                if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
            }
        };
    }
    public gsubMulti(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): GlyphTraceProc {
        const props = thProps.force();
        return tracer => {
            for (const [src, dst] of props.mapping.entries()) {
                if (tracer.has(src)) for (const g of dst) if (!tracer.has(g)) tracer.add(g);
            }
        };
    }
    public gsubAlternate(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): GlyphTraceProc {
        return this.gsubMulti(thProps);
    }
    public gsubLigature(thProps: Thunk<Ot.Gsub.LigatureProp>): GlyphTraceProc {
        const props = thProps.force();
        return tracer => {
            for (const { from, to } of props.mapping) {
                let found = true;
                for (const part of from) if (!tracer.has(part)) found = false;
                if (found && !tracer.has(to)) tracer.add(to);
            }
        };
    }
    public gsubReverse(thProps: Thunk<Ot.Gsub.ReverseSubProp>): GlyphTraceProc {
        const props = thProps.force();
        return tracer => {
            for (const rule of props.rules) {
                for (const [src, dst] of rule.replacement) {
                    if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
                }
            }
        };
    }
    public gposSingle(): GlyphTraceProc {
        return tracer => {};
    }
    public gposPair(): GlyphTraceProc {
        return tracer => {};
    }
    public gposCursive(): GlyphTraceProc {
        return tracer => {};
    }
    public gposMarkToBase(): GlyphTraceProc {
        return tracer => {};
    }
    public gposMarkToMark(): GlyphTraceProc {
        return tracer => {};
    }
    public gposMarkToLigature(): GlyphTraceProc {
        return tracer => {};
    }
    public gsubChaining(): GlyphTraceProc {
        return tracer => {};
    }
    public gposChaining(): GlyphTraceProc {
        return tracer => {};
    }
}
