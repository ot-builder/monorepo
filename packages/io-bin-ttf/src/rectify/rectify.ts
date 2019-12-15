import { Errors } from "@ot-builder/errors";
import { OtGeometryHandler, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export function rectifyGlyphOrder(gOrd: Data.Order<OtGlyph>) {
    let gs = new Set<OtGlyph>();
    for (const glyph of gOrd) {
        rectifyGlyph(glyph, gs);
    }
}

function rectifyGlyph(glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (gs.has(glyph)) return;

    if (glyph.geometry) {
        glyph.geometry = glyph.geometry.acceptGeometryAlgebra(new AttachmentPointToCoordAlg(gs))({
            points: []
        });
    }

    gs.add(glyph);
}

interface PointAttachmentHandlerState {
    points: OtGlyph.Point[];
}
type PointAttachmentHandler = (st: PointAttachmentHandlerState) => OtGlyph.Geometry;

class AttachmentPointToCoordAlg implements OtGlyph.GeometryAlg<PointAttachmentHandler> {
    constructor(private readonly gs: Set<OtGlyph>) {}
    public contourSet(cs: OtGlyph.ContourSetProps) {
        return (st: PointAttachmentHandlerState) => {
            const g = OtGlyph.ContourSet.create(cs.contours);
            for (const c of g.contours) for (const z of c) st.points.push(z);
            return g;
        };
    }
    public geometryList(processes: PointAttachmentHandler[]) {
        return (st: PointAttachmentHandlerState) => {
            let children: OtGlyph.Geometry[] = [];
            for (const proc of processes) {
                children.push(proc(st));
            }
            return OtGlyph.GeometryList.create(children);
        };
    }

    public ttReference(ref: OtGlyph.TtReferenceProps) {
        return (st: PointAttachmentHandlerState) => {
            rectifyGlyph(ref.to, this.gs);
            let tfm = ref.transform;
            let innerPoints = OtGeometryHandler.stat(OtGeometryHandler.ListPoint, ref.to.geometry);
            if (ref.pointAttachment) {
                const zOut = st.points[ref.pointAttachment.outer.pointIndex];
                const zIn = innerPoints[ref.pointAttachment.inner.pointIndex];
                if (zOut && zIn) {
                    const zInTransformed = OtGlyph.PointOps.applyTransform(zIn, {
                        ...ref.transform,
                        scaledOffset: false,
                        dx: 0,
                        dy: 0
                    });

                    tfm = {
                        ...ref.transform,
                        scaledOffset: false,
                        dx: OtVar.Ops.minus(zOut.x, zInTransformed.x),
                        dy: OtVar.Ops.minus(zOut.y, zInTransformed.y)
                    };
                } else {
                    throw Errors.Ttf.InvalidPointAttachment(
                        ref.pointAttachment.outer.pointIndex,
                        ref.pointAttachment.inner.pointIndex
                    );
                }
            }
            const geom = OtGlyph.TtReference.create(ref.to, tfm);
            geom.roundXyToGrid = ref.roundXyToGrid;
            geom.useMyMetrics = ref.useMyMetrics;
            geom.overlapCompound = ref.overlapCompound;
            geom.pointAttachment = ref.pointAttachment;
            for (const z of innerPoints) {
                st.points.push(OtGlyph.PointOps.applyTransform(z, tfm));
            }
            return geom;
        };
    }
}
