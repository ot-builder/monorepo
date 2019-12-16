import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";

import {
    CoordRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../interface";
import { RectifyImpl } from "../shared";

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
        private readonly recCoord: CoordRectifier,
        private readonly recPA: PointAttachmentRectifier,
        private readonly context: PointAttachmentGlobalState
    ) {}

    public contourSet(cs: Ot.Glyph.ContourSetProps) {
        return (st: PointAttachmentHandlerState) => {
            const cs1: Ot.Glyph.Contour[] = [];
            for (const c of cs.contours) {
                const c1: Ot.Glyph.Contour = [];
                for (let zid = 0; zid < c.length; zid++) {
                    const z = c[zid];
                    c1[zid] = Ot.Glyph.Point.create(
                        this.recCoord.coord(z.x),
                        this.recCoord.coord(z.y),
                        z.kind
                    );
                }
                cs1.push(c1);
            }

            const g = Ot.Glyph.ContourSet.create(cs1);
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
            processGlyph(this.recCoord, this.recPA, ref.to, this.context);
            const ref1 = Ot.Glyph.TtReference.create(ref.to, {
                ...ref.transform,
                dx: this.recCoord.coord(ref.transform.dx),
                dy: this.recCoord.coord(ref.transform.dy)
            });
            ref1.roundXyToGrid = ref.roundXyToGrid;
            ref1.useMyMetrics = ref.useMyMetrics;
            ref1.overlapCompound = ref.overlapCompound;
            ref1.pointAttachment = ref.pointAttachment;
            let innerPoints = RectifyImpl.getGlyphPoints(ref.to);
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
        const accept = this.recPA.acceptOffset(desiredOffset, {
            x: ref1.transform.dx,
            y: ref1.transform.dy
        });
        if (accept.x && accept.y) return;

        switch (this.recPA.manner) {
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

class RectifyHintCoordAlg implements Ot.Glyph.HintAlg<Ot.Glyph.Hint> {
    constructor(private readonly rec: CoordRectifier) {}

    public ttInstructions(tt: Ot.Glyph.TtInstructionProps): Ot.Glyph.Hint {
        return Ot.Glyph.TtInstructionHint.create(tt.instructions);
    }
    public cffHint(ch: Ot.Glyph.CffHintProps): Ot.Glyph.Hint {
        const stemHMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        const stemVMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        for (const s of ch.hStems) stemHMap.set(s, this.rectifyHintStem(s));
        for (const s of ch.vStems) stemVMap.set(s, this.rectifyHintStem(s));
        const h1 = Ot.Glyph.CffHint.create();
        h1.hStems = [...stemHMap.values()];
        h1.vStems = [...stemVMap.values()];
        h1.hintMasks = ch.hintMasks.map(m => this.rectifyMask(m, stemHMap, stemVMap));
        h1.counterMasks = ch.counterMasks.map(m => this.rectifyMask(m, stemHMap, stemVMap));
        return h1;
    }
    private rectifyHintStem(stem: Ot.Glyph.CffHintStem) {
        return Ot.Glyph.CffHint.createStem(this.rec.coord(stem.start), this.rec.coord(stem.end));
    }
    private rectifyMask(
        mask: Ot.Glyph.CffHintMask,
        stemHMap: Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>,
        stemVMap: Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>
    ) {
        const maskH: Set<Ot.Glyph.CffHintStem> = new Set();
        const maskV: Set<Ot.Glyph.CffHintStem> = new Set();
        for (const s of mask.maskH) {
            const s1 = stemHMap.get(s);
            if (s1) maskH.add(s1);
        }
        for (const s of mask.maskV) {
            const s1 = stemVMap.get(s);
            if (s1) maskV.add(s1);
        }
        return Ot.Glyph.CffHint.createMask(mask.at, maskH, maskV);
    }
}

function processGlyph(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    glyph: Ot.Glyph,
    gs: PointAttachmentGlobalState
) {
    if (gs.processed.has(glyph)) return;

    if (glyph.geometry) {
        glyph.geometry = glyph.geometry.acceptGeometryAlgebra(
            new OtGhRectifyGeomPointAttachmentAlg(recCoord, recPA, gs)
        )({
            points: []
        });
    }
    if (glyph.hints) {
        glyph.hints = glyph.hints.acceptHintAlgebra(new RectifyHintCoordAlg(recCoord));
    }
    glyph.horizontal = {
        start: recCoord.coord(glyph.horizontal.start),
        end: recCoord.coord(glyph.horizontal.end)
    };
    glyph.vertical = {
        start: recCoord.coord(glyph.vertical.start),
        end: recCoord.coord(glyph.vertical.end)
    };

    gs.processed.add(glyph);
}

export function rectifyGlyphsCoordPA<GS extends Data.OrderStore<Ot.Glyph>>(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    const gOrd = font.glyphs.decideOrder();
    const st: PointAttachmentGlobalState = { processed: new Set() };

    for (const g of gOrd) processGlyph(recCoord, recPA, g, st);
}
