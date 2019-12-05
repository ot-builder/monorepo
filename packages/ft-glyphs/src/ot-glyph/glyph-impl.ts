import { Data, Rectify, Trace } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

export interface OtGlyph extends GeneralGlyph.GlyphT<OtGlyph, OtVar.Value> {
    name?: string;
}

export class OtGlyphImpl implements OtGlyphInterface {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometry: Data.Maybe<GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>> = null;
    public hints: Data.Maybe<GeneralGlyph.HintT<OtVar.Value>> = null;

    public acceptGeometryVisitor(
        visitor: GeneralGlyph.GeometryVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        if (this.geometry) this.geometry.acceptGeometryVisitor(visitor);
    }
    public acceptHintVisitor(visitor: GeneralGlyph.HintVisitorT<OtVar.Value>) {
        if (this.hints) this.hints.acceptHintVisitor(visitor);
    }

    public rectifyCoords(rectify: OtVar.Rectifier) {
        this.horizontal = {
            start: rectify.coord(this.horizontal.start),
            end: rectify.coord(this.horizontal.end)
        };
        this.vertical = {
            start: rectify.coord(this.vertical.start),
            end: rectify.coord(this.vertical.end)
        };
        if (this.geometry) this.geometry.rectifyCoords(rectify);
        if (this.hints) this.hints.rectifyCoords(rectify);
    }

    public rectifyGlyphs(rectify: Rectify.Glyph.RectifierT<OtGlyphInterface>) {
        if (this.geometry) {
            const removed = this.geometry.rectifyGlyphs(rectify);
            if (removed) this.geometry = null;
        }
    }

    public traceGlyphs(tracer: Trace.Glyph.TracerT<OtGlyphInterface>) {
        if (!tracer.has(this)) return;
        if (this.geometry) this.geometry.traceGlyphs(tracer);
    }

    public rectifyPointAttachment(
        rec: Rectify.PointAttach.RectifierT<OtGlyphInterface, OtVar.Value>,
        c: OtGlyphInterface
    ) {
        if (this.geometry) this.geometry.rectifyPointAttachment(rec, c);
    }

    /**
     * Duplicate glyph (note: it won't duplicate references)
     */
    public duplicate() {
        const g1 = new OtGlyphImpl();
        g1.horizontal = { ...this.horizontal };
        g1.vertical = { ...this.vertical };
        if (this.geometry) g1.geometry = this.geometry.duplicate();
        if (this.hints) g1.hints = this.hints.duplicate();
        return g1;
    }
}
