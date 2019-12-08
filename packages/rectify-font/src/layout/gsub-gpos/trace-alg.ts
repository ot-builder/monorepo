import { TraceImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Trace } from "@ot-builder/prelude";

export function traceLayoutGlyphs(table: Ot.GsubGpos.Table): TraceProc {
    const alg = new TraceGlyphAlg();
    return TraceImpl.Glyph.Seq(table.lookups.map(lookup => lookup.acceptLookupAlgebra(alg)));
}

type TraceProc = Trace.Glyph.ProcT<Ot.Glyph>;
export class TraceGlyphAlg implements Ot.GsubGpos.LookupAlg<TraceProc> {
    public gsubSingle(props: Ot.Gsub.SingleProp): TraceProc {
        return tracer => {
            for (const [src, dst] of props.mapping) {
                if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
            }
        };
    }
    public gsubMulti(props: Ot.Gsub.MultipleAlternateProp): TraceProc {
        return tracer => {
            for (const [src, dst] of props.mapping.entries()) {
                if (tracer.has(src)) for (const g of dst) if (!tracer.has(g)) tracer.add(g);
            }
        };
    }
    public gsubAlternate(props: Ot.Gsub.MultipleAlternateProp): TraceProc {
        return this.gsubMulti(props);
    }
    public gsubLigature(props: Ot.Gsub.LigatureProp): TraceProc {
        return tracer => {
            for (const { from, to } of props.mapping) {
                let found = true;
                for (const part of from) if (!tracer.has(part)) found = false;
                if (found && !tracer.has(to)) tracer.add(to);
            }
        };
    }
    public gsubReverse(props: Ot.Gsub.ReverseSubProp): TraceProc {
        return tracer => {
            for (const rule of props.rules) {
                for (const [src, dst] of rule.replacement) {
                    if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
                }
            }
        };
    }
    public gposSingle(props: Ot.Gpos.SingleProp): TraceProc {
        return tracer => {};
    }
    public gposPair(props: Ot.Gpos.PairProp): TraceProc {
        return tracer => {};
    }
    public gposCursive(props: Ot.Gpos.CursiveProp): TraceProc {
        return tracer => {};
    }
    public gposMarkToBase(props: Ot.Gpos.MarkToBaseProp): TraceProc {
        return tracer => {};
    }
    public gposMarkToMark(props: Ot.Gpos.MarkToMarkProp): TraceProc {
        return tracer => {};
    }
    public gposMarkToLigature(props: Ot.Gpos.MarkToLigatureProp): TraceProc {
        return tracer => {};
    }
    public gsubChaining(props: Ot.GsubGpos.ChainingProp<TraceProc>): TraceProc {
        return tracer => {};
    }
    public gposChaining(props: Ot.GsubGpos.ChainingProp<TraceProc>): TraceProc {
        return tracer => {};
    }
}
