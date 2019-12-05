import { Rectify, Trace } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

type Geometry = GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>;
export class GeometryList implements Geometry {
    constructor(public items: Geometry[] = []) {}

    public acceptGeometryVisitor(
        visitor: GeneralGlyph.GeometryVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        visitor.begin();
        for (const part of this.items) part.acceptGeometryVisitor(visitor);
        visitor.end();
    }
    public rectifyCoords(rec: OtVar.Rectifier) {
        for (const part of this.items) part.rectifyCoords(rec);
    }
    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyphInterface>) {
        let newItems: Geometry[] = [];
        for (const part of this.items) {
            const remove = part.rectifyGlyphs(rec);
            if (!remove) newItems.push(part);
        }
        this.items = newItems;
        return !newItems.length;
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<OtGlyphInterface>) {
        for (const part of this.items) part.traceGlyphs(tracer);
    }
    public rectifyPointAttachment(
        rec: Rectify.PointAttach.RectifierT<OtGlyphInterface, OtVar.Value>,
        c: OtGlyphInterface
    ) {
        for (const part of this.items) part.rectifyPointAttachment(rec, c);
    }
    public duplicate() {
        return new GeometryList(this.items.map(part => part.duplicate()));
    }
}
