import { Rectify } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

import { OtGhPointLister } from "./point-lister";

export class OtGhStdPointAttachRectifier
    implements Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value> {
    constructor(readonly manner: Rectify.PointAttach.Manner, readonly error = 1 / 16) {}

    public getGlyphPoint(g: OtGlyph, zid: number): null | Rectify.PointAttach.XYFT<OtVar.Value> {
        const lister = new OtGhPointLister();
        if (g.geometry) g.geometry.acceptGeometryAlgebra(lister);
        const points = lister.getResult();
        return points[zid];
    }

    public acceptOffset(
        actual: Rectify.PointAttach.XYT<OtVar.Value>,
        desired: Rectify.PointAttach.XYT<OtVar.Value>
    ) {
        let xSame = OtVar.Ops.equal(actual.x || 0, desired.x || 0, this.error);
        let ySame = OtVar.Ops.equal(actual.y || 0, desired.y || 0, this.error);
        return { x: xSame, y: ySame };
    }
}

export class OtGhRectifyGeomPointAttachmentAlg
    implements OtGlyph.GeometryAlg<null | OtGlyph.Geometry> {
    constructor(
        private readonly rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>,
        private readonly context: OtGlyph
    ) {}
    public empty() {
        return null;
    }
    public contourSet(cs: OtGlyph.ContourSetProps) {
        return OtGlyph.ContourSet.create(cs.contours);
    }
    public geometryList(children: (null | OtGlyph.Geometry)[]) {
        const meaningful: OtGlyph.Geometry[] = [];
        for (const item of children) if (item) meaningful.push(item);
        if (!meaningful.length) return null;
        return OtGlyph.GeometryList.create(meaningful);
    }
    public ttReference(ref: OtGlyph.TtReferenceProps) {
        const ref1 = OtGlyph.TtReference.create(ref.to, ref.transform);
        ref1.roundXyToGrid = ref.roundXyToGrid;
        ref1.useMyMetrics = ref.useMyMetrics;
        ref1.overlapCompound = ref.overlapCompound;
        ref1.pointAttachment = ref.pointAttachment;

        if (!ref1.pointAttachment) return ref1;

        const desired = this.computePointAttachmentOffset(ref1);
        if (!desired) {
            ref1.pointAttachment = null;
            return ref1;
        }

        const accept = this.rec.acceptOffset(desired, {
            x: ref1.transform.dx,
            y: ref1.transform.dy
        });
        if (accept.x && accept.y) return ref1;

        switch (this.rec.manner) {
            case Rectify.PointAttach.Manner.TrustAttachment:
                ref1.transform = {
                    ...ref1.transform,
                    dx: desired.x,
                    dy: desired.y,
                    scaledOffset: false
                };
                break;
            case Rectify.PointAttach.Manner.TrustCoordinate:
                ref1.pointAttachment = null;
                break;
        }

        return ref1;
    }

    private computePointAttachmentOffset(ref1: OtGlyph.TtReference) {
        if (!ref1.pointAttachment) return null;
        const outerPoint = this.rec.getGlyphPoint(
            this.context,
            ref1.pointAttachment.outer.pointIndex
        );
        const innerPoint = this.rec.getGlyphPoint(ref1.to, ref1.pointAttachment.inner.pointIndex);

        if (!outerPoint || !innerPoint) return null;

        const transformedInner = OtGlyph.PointOps.applyTransform(
            OtGlyph.Point.create(innerPoint.x, innerPoint.y),
            {
                ...ref1.transform,
                dx: 0,
                dy: 0
            }
        );
        return OtGlyph.PointOps.minus(
            OtGlyph.Point.create(outerPoint.x, outerPoint.y),
            transformedInner
        );
    }
}
