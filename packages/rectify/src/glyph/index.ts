import * as Ot from "@ot-builder/ot";
import { Data } from "@ot-builder/prelude";

import {
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../interface";
import { RectifyImpl } from "../shared";

interface GlyphRectifyGlobalState {
    processedGlyphs: Set<Ot.Glyph>;
}
interface GlyphRectifyHandlerState {
    points: Data.XY<Ot.Var.Value>[];
}

class GeometryProcessor {
    constructor(
        private readonly recGlyphRef: GlyphReferenceRectifier,
        private readonly recCoord: CoordRectifier,
        private readonly recPA: PointAttachmentRectifier,
        private readonly globalState: GlyphRectifyGlobalState
    ) {}

    public process(
        geom: Ot.Glyph.Geometry,
        st: GlyphRectifyHandlerState
    ): null | Ot.Glyph.Geometry {
        switch (geom.type) {
            case Ot.Glyph.GeometryType.ContourSet:
                return this.processContourSet(geom, st);
            case Ot.Glyph.GeometryType.GeometryList:
                return this.processGeometryList(geom.items, st);
            case Ot.Glyph.GeometryType.TtReference:
                return this.processTtReference(geom, st);
        }
    }

    private processContourSet(cs: Ot.Glyph.ContourSetProps, st: GlyphRectifyHandlerState) {
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

        const g = new Ot.Glyph.ContourSet(cs1);
        for (const c of g.contours) for (const z of c) st.points.push(z);
        return g;
    }

    private processGeometryList(
        items: ReadonlyArray<Ot.Glyph.Geometry>,
        st: GlyphRectifyHandlerState
    ) {
        const sink: Ot.Glyph.Geometry[] = [];
        for (const item of items) {
            const processed = this.process(item, st);
            if (processed) sink.push(processed);
        }
        if (sink.length) return new Ot.Glyph.GeometryList(sink);
        else return null;
    }

    private processTtReference(ref: Ot.Glyph.TtReferenceProps, st: GlyphRectifyHandlerState) {
        const to1 = this.recGlyphRef.glyphRef(ref.to);
        if (!to1) return null;

        processGlyph(this.recGlyphRef, this.recCoord, this.recPA, to1, this.globalState);
        const ref1 = new Ot.Glyph.TtReference(to1, {
            ...ref.transform,
            dx: this.recCoord.coord(ref.transform.dx),
            dy: this.recCoord.coord(ref.transform.dy)
        });
        ref1.roundXyToGrid = ref.roundXyToGrid;
        ref1.useMyMetrics = ref.useMyMetrics;
        ref1.pointAttachment = ref.pointAttachment;
        const innerPoints = RectifyImpl.getGlyphPoints(to1);
        this.processTtReferenceImpl(innerPoints, st, ref1);
        for (const z of innerPoints) {
            st.points.push(
                Ot.Glyph.PointOps.applyTransform(Ot.Glyph.Point.create(z.x, z.y), ref1.transform)
            );
        }
        return ref1;
    }

    private processTtReferenceImpl(
        innerPoints: Data.XY<Ot.Var.Value>[],
        st: GlyphRectifyHandlerState,
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

class HintProcessor {
    constructor(private readonly rec: CoordRectifier) {}

    public process(geom: Ot.Glyph.Hint): Ot.Glyph.Hint {
        switch (geom.type) {
            case Ot.Glyph.HintType.TtInstruction:
                return this.processTtInstructions(geom);
            case Ot.Glyph.HintType.CffHint:
                return this.processCffHint(geom);
        }
    }

    private processTtInstructions(tt: Ot.Glyph.TtInstructionProps): Ot.Glyph.Hint {
        return new Ot.Glyph.TtInstruction(tt.instructions);
    }

    private processCffHint(ch: Ot.Glyph.CffHintProps): Ot.Glyph.Hint {
        const stemHMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        const stemVMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        for (const s of ch.hStems) stemHMap.set(s, this.processHintStem(s));
        for (const s of ch.vStems) stemVMap.set(s, this.processHintStem(s));
        const h1 = new Ot.Glyph.CffHint();
        h1.hStems = [...stemHMap.values()];
        h1.vStems = [...stemVMap.values()];
        h1.hintMasks = ch.hintMasks.map(m => this.processMask(m, stemHMap, stemVMap));
        h1.counterMasks = ch.counterMasks.map(m => this.processMask(m, stemHMap, stemVMap));
        return h1;
    }
    private processHintStem(stem: Ot.Glyph.CffHintStem) {
        return Ot.Glyph.CffHint.createStem(this.rec.coord(stem.start), this.rec.coord(stem.end));
    }
    private processMask(
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
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    glyph: Ot.Glyph,
    gs: GlyphRectifyGlobalState
) {
    if (gs.processedGlyphs.has(glyph)) return;

    if (glyph.geometry) {
        const alg = new GeometryProcessor(recGlyphRef, recCoord, recPA, gs);
        glyph.geometry = alg.process(glyph.geometry, { points: [] });
    }
    if (glyph.hints) {
        glyph.hints = new HintProcessor(recCoord).process(glyph.hints);
    }
    glyph.horizontal = {
        start: recCoord.coord(glyph.horizontal.start),
        end: recCoord.coord(glyph.horizontal.end)
    };
    glyph.vertical = {
        start: recCoord.coord(glyph.vertical.start),
        end: recCoord.coord(glyph.vertical.end)
    };

    gs.processedGlyphs.add(glyph);
}

export function inPlaceRectifyGlyphStore<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    glyphs: GS
) {
    const gOrd = glyphs.decideOrder();
    const st: GlyphRectifyGlobalState = { processedGlyphs: new Set() };

    for (const g of gOrd) processGlyph(recGlyphRef, recCoord, recPA, g, st);
}
