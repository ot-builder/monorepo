import { Access, Rectify, Trace } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";
import { CPoint } from "./point";

// Geometry types
export class ContourSet implements GeneralGlyph.ContourSetGeometryT<OtGlyphInterface, OtVar.Value> {
    constructor(public contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []) {}
    public acceptGeometryVisitor(
        visitor: GeneralGlyph.GeometryVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        visitor.begin();
        visitor.visitContourSet(this);
        visitor.end();
    }
    public acceptContourSetVisitor(
        cVisitor: GeneralGlyph.ContourSetVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        cVisitor.begin();
        cVisitor.visitContourSet(this);
        cVisitor.end();
    }
    public *listContours() {
        for (let cid = 0; cid < this.contours.length; cid++) {
            yield new ContourShapeImpl(this, cid);
        }
    }

    public rectifyCoords(rectify: OtVar.Rectifier) {
        for (const c of this.contours) {
            for (let zid = 0; zid < c.length; zid++) {
                const z = c[zid];
                c[zid] = new CPoint(rectify.coord(z.x), rectify.coord(z.y), z.kind);
            }
        }
    }
    public rectifyGlyphs(rectify: Rectify.Glyph.RectifierT<OtGlyphInterface>) {}
    public traceGlyphs(tracer: Trace.Glyph.TracerT<OtGlyphInterface>) {}
    public rectifyPointAttachment() {}
    public duplicate() {
        let c1 = this.contours.map(c => c.map(z => ({ ...z })));
        return new ContourSet(c1);
    }
}
class ContourShapeImpl implements GeneralGlyph.ContourShapeT<OtGlyphInterface, OtVar.Value> {
    constructor(private readonly cs: ContourSet, private readonly cid: number) {}
    public acceptContourVisitor(
        cVisitor: GeneralGlyph.ContourVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        cVisitor.begin();
        cVisitor.visitContour(this);
        cVisitor.end();
    }
    public *listPoints() {
        yield* this.cs.contours[this.cid];
    }
    public *listPointAccesses() {
        const contour = this.cs.contours[this.cid];
        for (let zid = 0; zid < contour.length; zid++) {
            yield new ContourSetPointPtr(this.cs, this.cid, zid);
        }
    }
}
class ContourSetPointPtr implements Access<GeneralGlyph.Point.T<OtVar.Value>> {
    constructor(
        private readonly cs: ContourSet,
        private readonly cid: number,
        private readonly zid: number
    ) {}
    public get() {
        return this.cs.contours[this.cid][this.zid];
    }
    public set(z: GeneralGlyph.Point.T<OtVar.Value>) {
        this.cs.contours[this.cid][this.zid] = z;
    }
}
