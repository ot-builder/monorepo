import { Access, Data, Rectify, Trace } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";
import { CPoint, PointAttachment, PointOps } from "./point";

export class TtReference implements GeneralGlyph.ReferenceGeometryT<OtGlyphInterface, OtVar.Value> {
    constructor(
        public to: OtGlyphInterface,
        public transform: GeneralGlyph.Transform2X3.T<OtVar.Value>
    ) {}
    public roundXyToGrid = false;
    public useMyMetrics = false;
    public overlapCompound = false;
    public pointAttachment: Data.Maybe<PointAttachment> = null;
    public acceptGeometryVisitor(
        visitor: GeneralGlyph.GeometryVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        visitor.begin();
        visitor.visitReference(this);
        visitor.end();
    }
    public acceptReferenceVisitor(
        refVisitor: GeneralGlyph.ReferenceVisitorT<OtGlyphInterface, OtVar.Value>
    ) {
        refVisitor.begin();
        refVisitor.visitTarget(new TtReferenceGlyphPtr(this));
        refVisitor.visitTransform(new TtReferenceTransformPtr(this));
        if (this.pointAttachment) {
            refVisitor.setPointAttachment(
                this.pointAttachment.inner.pointIndex,
                this.pointAttachment.outer.pointIndex
            );
        }
        refVisitor.setFlag("roundXyToGrid", this.roundXyToGrid);
        refVisitor.setFlag("useMyMetrics", this.useMyMetrics);
        refVisitor.setFlag("overlapCompound", this.overlapCompound);
        refVisitor.end();
    }
    public rectifyCoords(rectify: OtVar.Rectifier) {
        this.transform = {
            ...this.transform,
            dx: rectify.coord(this.transform.dx),
            dy: rectify.coord(this.transform.dy)
        };
    }
    public rectifyGlyphs(rectify: Rectify.Glyph.RectifierT<OtGlyphInterface>) {
        const to1 = rectify.glyph(this.to);
        if (!to1) return true;
        this.to = to1;
        return false;
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<OtGlyphInterface>) {
        if (!tracer.has(this.to)) {
            tracer.add(this.to);
            this.to.traceGlyphs(tracer);
        }
    }
    public rectifyPointAttachment(
        rec: Rectify.PointAttach.RectifierT<OtGlyphInterface, OtVar.Value>,
        c: OtGlyphInterface
    ) {
        if (!this.pointAttachment) return;

        const desired = this.computePointAttachmentOffset(rec, c);
        if (!desired) {
            this.pointAttachment = null;
            return;
        }

        const accept = rec.acceptOffset(desired, {
            x: this.transform.dx,
            y: this.transform.dy
        });
        if (accept.x && accept.y) return;

        switch (rec.manner) {
            case Rectify.PointAttach.Manner.TrustAttachment:
                this.transform = {
                    ...this.transform,
                    dx: desired.x,
                    dy: desired.y,
                    scaledOffset: false
                };
                break;
            case Rectify.PointAttach.Manner.TrustCoordinate:
                this.pointAttachment = null;
                break;
        }
    }

    private computePointAttachmentOffset(
        rec: Rectify.PointAttach.RectifierT<OtGlyphInterface, OtVar.Value>,
        c: OtGlyphInterface
    ) {
        if (!this.pointAttachment) return null;
        const outerPoint = rec.getGlyphPoint(c, this.pointAttachment.outer.pointIndex);
        const innerPoint = rec.getGlyphPoint(this.to, this.pointAttachment.inner.pointIndex);

        if (!outerPoint || !innerPoint) return null;

        const transformedInner = PointOps.applyTransform(
            CPoint.create(innerPoint.x, innerPoint.y),
            {
                ...this.transform,
                dx: 0,
                dy: 0
            }
        );
        return PointOps.minus(CPoint.create(outerPoint.x, outerPoint.y), transformedInner);
    }
    public duplicate() {
        const ref1 = new TtReference(this.to, { ...this.transform });
        ref1.roundXyToGrid = this.roundXyToGrid;
        ref1.useMyMetrics = this.useMyMetrics;
        ref1.overlapCompound = this.overlapCompound;
        if (this.pointAttachment) ref1.pointAttachment = { ...this.pointAttachment };
        return ref1;
    }
}
class TtReferenceGlyphPtr implements Access<OtGlyphInterface> {
    constructor(private ref: TtReference) {}
    public get() {
        return this.ref.to;
    }
    public set(g: OtGlyphInterface) {
        this.ref.to = g;
    }
}
class TtReferenceTransformPtr implements Access<GeneralGlyph.Transform2X3.T<OtVar.Value>> {
    constructor(private ref: TtReference) {}
    public get() {
        return this.ref.transform;
    }
    public set(tfm: GeneralGlyph.Transform2X3.T<OtVar.Value>) {
        this.ref.transform = tfm;
    }
}
