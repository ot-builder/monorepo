import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude/src";

import { PointAttachmentRectifier, PointAttachmentRectifyManner } from "../interface";

interface PointAttachmentGlobalState {
    processed: Set<Ot.Glyph>;
}
interface PointAttachmentHandlerState {
    points: Data.XY<Ot.Var.Value>[];
}
type PointAttachmentHandler = (st: PointAttachmentHandlerState) => Ot.Glyph.Geometry;

export class OtGhRectifyGeomPointAttachmentAlg
    implements Ot.Glyph.GeometryAlg<PointAttachmentHandler> {
    constructor(
        private readonly rec: PointAttachmentRectifier,
        private readonly context: PointAttachmentGlobalState
    ) {}

    public contourSet(cs: Ot.Glyph.ContourSetProps) {
        return (st: PointAttachmentHandlerState) => {
            const g = Ot.Glyph.ContourSet.create(cs.contours);
            for (const c of g.contours) for (const z of c) st.points.push(z);
            return g;
        };
    }
    public geometryList(processes: PointAttachmentHandler[]) {
        return (st: PointAttachmentHandlerState) => {
            let children: Ot.Glyph.Geometry[] = [];
            for (const proc of processes) {
                children.push(proc(st));
            }
            return Ot.Glyph.GeometryList.create(children);
        };
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps) {
        return (st: PointAttachmentHandlerState) => {
            processGlyph(this.rec, ref.to, this.context);
            const ref1 = Ot.Glyph.TtReference.create(ref.to, ref.transform);
            ref1.roundXyToGrid = ref.roundXyToGrid;
            ref1.useMyMetrics = ref.useMyMetrics;
            ref1.overlapCompound = ref.overlapCompound;
            ref1.pointAttachment = ref.pointAttachment;
            let innerPoints = this.rec.getGlyphPoints(ref.to);
            this.processTtReferenceImpl(innerPoints, st, ref1);
            for (const z of innerPoints) {
                st.points.push(
                    Ot.Glyph.PointOps.applyTransform(
                        Ot.Glyph.Point.create(z.x, z.y),
                        ref1.transform
                    )
                );
            }
            return ref1;
        };
    }

    private processTtReferenceImpl(
        innerPoints: Data.XY<Ot.Var.Value>[],
        st: PointAttachmentHandlerState,
        ref1: Ot.Glyph.TtReference
    ) {
        if (!ref1.pointAttachment) return;

        const pOut = st.points[ref1.pointAttachment.outer.pointIndex];
        const pIn = innerPoints[ref1.pointAttachment.inner.pointIndex];
        if (!pIn || !pOut) {
            ref1.pointAttachment = null;
            return;
        }

        const desiredOffset = Ot.Glyph.PointOps.minus(
            Ot.Glyph.Point.create(pOut.x, pOut.y),
            Ot.Glyph.PointOps.applyTransform(Ot.Glyph.Point.create(pIn.x, pIn.y), {
                ...ref1.transform,
                scaledOffset: false,
                dx: 0,
                dy: 0
            })
        );
        const accept = this.rec.acceptOffset(desiredOffset, {
            x: ref1.transform.dx,
            y: ref1.transform.dy
        });
        if (accept.x && accept.y) return;

        switch (this.rec.manner) {
            case PointAttachmentRectifyManner.TrustAttachment:
                ref1.transform = {
                    ...ref1.transform,
                    dx: desiredOffset.x,
                    dy: desiredOffset.y,
                    scaledOffset: false
                };
                break;
            case PointAttachmentRectifyManner.TrustCoordinate:
                ref1.pointAttachment = null;
                break;
        }
    }
}

function processGlyph(
    rec: PointAttachmentRectifier,
    glyph: Ot.Glyph,
    gs: PointAttachmentGlobalState
) {
    if (gs.processed.has(glyph)) return;

    if (glyph.geometry) {
        glyph.geometry = glyph.geometry.acceptGeometryAlgebra(
            new OtGhRectifyGeomPointAttachmentAlg(rec, gs)
        )({
            points: []
        });
    }

    gs.processed.add(glyph);
}

export function rectifyGlyphsPA<GS extends Data.OrderStore<Ot.Glyph>>(
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    const gOrd = font.glyphs.decideOrder();
    const st: PointAttachmentGlobalState = { processed: new Set() };

    for (const g of gOrd) processGlyph(recPA, g, st);
}
