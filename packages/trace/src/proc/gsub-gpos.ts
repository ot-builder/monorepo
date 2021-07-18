import * as Ot from "@ot-builder/ot";

import { GlyphTraceProc } from "../interface";

import * as TraceImpl_Glyph from "./trace-impl/glyph";

export function traceGsub(table: Ot.Gsub.Table): GlyphTraceProc {
    const alg = new ItTraceGlyph<{ ref: Ot.Gsub.Lookup }>();
    return TraceImpl_Glyph.Seq(table.lookups.map(lookup => alg.process(lookup)));
}

export function traceGpos(table: Ot.Gpos.Table): GlyphTraceProc {
    const alg = new ItTraceGlyph<{ ref: Ot.Gpos.Lookup }>();
    return TraceImpl_Glyph.Seq(table.lookups.map(lookup => alg.process(lookup)));
}

class ItTraceGlyph<E> {
    public process(lookup: Ot.Gsub.Lookup | Ot.Gpos.Lookup): GlyphTraceProc {
        switch (lookup.type) {
            case Ot.Gsub.LookupType.Single:
                return this.gsubSingle(lookup);
            case Ot.Gsub.LookupType.Multi:
            case Ot.Gsub.LookupType.Alternate:
                return this.gsubMulti(lookup);
            case Ot.Gsub.LookupType.Ligature:
                return this.gsubLigature(lookup);
            case Ot.Gsub.LookupType.Reverse:
                return this.gsubReverse(lookup);
            default:
                return tracer => {};
        }
    }
    protected gsubSingle(props: Ot.Gsub.SingleProp): GlyphTraceProc {
        return tracer => {
            for (const [src, dst] of props.mapping) {
                if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
            }
        };
    }
    protected gsubMulti(props: Ot.Gsub.MultipleAlternateProp): GlyphTraceProc {
        return tracer => {
            for (const [src, dst] of props.mapping.entries()) {
                if (tracer.has(src)) for (const g of dst) if (!tracer.has(g)) tracer.add(g);
            }
        };
    }
    protected gsubLigature(props: Ot.Gsub.LigatureProp): GlyphTraceProc {
        return tracer => {
            for (const { from, to } of props.mapping) {
                let found = true;
                for (const part of from) if (!tracer.has(part)) found = false;
                if (found && !tracer.has(to)) tracer.add(to);
            }
        };
    }
    protected gsubReverse(props: Ot.Gsub.ReverseSubProp): GlyphTraceProc {
        return tracer => {
            for (const rule of props.rules) {
                for (const [src, dst] of rule.replacement) {
                    if (tracer.has(src) && !tracer.has(dst)) tracer.add(dst);
                }
            }
        };
    }
}
