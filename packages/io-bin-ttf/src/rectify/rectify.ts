import { Errors } from "@ot-builder/errors";
import { OtGeometryHandler, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export function rectifyGlyphOrder(gOrd: Data.Order<OtGlyph>) {
    const gs = new Set<OtGlyph>();
    for (const glyph of gOrd) {
        rectifyGlyph(glyph, gs);
    }
}

function rectifyGlyph(glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (gs.has(glyph)) return;

    if (glyph.geometry) {
        const alg = new AttachmentPointToCoordAlg(gs);
        glyph.geometry = alg.process(glyph.geometry)({ points: [] });
    }

    gs.add(glyph);
}

interface PointAttachmentHandlerState {
    points: OtGlyph.Point[];
}
type PointAttachmentHandler = (st: PointAttachmentHandlerState) => OtGlyph.Geometry;

class AttachmentPointToCoordAlg {
    constructor(private readonly gs: Set<OtGlyph>) {}

    public process(geom: OtGlyph.Geometry): PointAttachmentHandler {
        switch (geom.type) {
            case OtGlyph.GeometryType.ContourSet:
                return this.contourSet(geom);
            case OtGlyph.GeometryType.TtReference:
                return this.ttReference(geom);
            case OtGlyph.GeometryType.GeometryList:
                return this.geometryList(geom.items.map(item => this.process(item)));
        }
    }
    public contourSet(cs: OtGlyph.ContourSetProps): PointAttachmentHandler {
        return (st: PointAttachmentHandlerState) => {
            const g = new OtGlyph.ContourSet(cs.contours);
            for (const c of g.contours) for (const z of c) st.points.push(z);
            return g;
        };
    }
    public geometryList(processes: PointAttachmentHandler[]): PointAttachmentHandler {
        return (st: PointAttachmentHandlerState) => {
            const children: OtGlyph.Geometry[] = [];
            for (const proc of processes) {
                children.push(proc(st));
            }
            return new OtGlyph.GeometryList(children);
        };
    }

    public ttReference(ref: OtGlyph.TtReferenceProps): PointAttachmentHandler {
        return (st: PointAttachmentHandlerState) => {
            rectifyGlyph(ref.to, this.gs);
            let tfm = ref.transform;
            const innerPoints = OtGeometryHandler.stat(
                OtGeometryHandler.ListPoint,
                ref.to.geometry
            );
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
            const geom = new OtGlyph.TtReference(ref.to, tfm);
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
