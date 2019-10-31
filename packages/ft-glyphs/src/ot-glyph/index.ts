import { ImpLib } from "@ot-builder/common-impl";
import { Caster, Data, Rectify, Trace } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphCoStat } from "./co-stat";
import { OtGlyphStat } from "./stat";

export class OtGlyph
    implements GeneralGlyph.T<OtGlyph, OtVar.Value>, GeneralGlyph.GeometryT<OtGlyph, OtVar.Value> {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometry: Data.Maybe<OtGlyph.Geometry> = null;
    public hints: Data.Maybe<OtGlyph.Hint> = null;

    public visitGeometry(sink: OtGlyph.GeometryVisitor) {
        if (this.geometry) this.geometry.visitGeometry(sink);
    }
    public visitHint(sink: OtGlyph.HintVisitor) {
        if (this.hints) this.hints.visitHint(sink);
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

    public rectifyGlyphs(rectify: OtGlyph.Rectifier) {
        if (this.geometry) {
            const removed = this.geometry.rectifyGlyphs(rectify);
            if (removed) this.geometry = null;
        }
    }

    public traceGlyphs(tracer: OtGlyph.Tracer) {
        if (!tracer.has(this)) return;
        if (this.geometry) this.geometry.traceGlyphs(tracer);
    }

    public rectifyPointAttachment(
        rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>,
        c: OtGlyph
    ) {
        if (this.geometry) this.geometry.rectifyPointAttachment(rec, c);
    }
}
export namespace OtGlyph {
    export type Geometry = GeneralGlyph.GeometryT<OtGlyph, OtVar.Value>;
    export type Hint = GeneralGlyph.HintT<OtVar.Value>;
    export type Metric = GeneralGlyph.Metric.T<OtVar.Value>;
    export type Transform2X3 = GeneralGlyph.Transform2X3.T<OtVar.Value>;
    export namespace Transform2X3 {
        export function Neutral(): Transform2X3 {
            return { scaledOffset: false, xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0 };
        }
        export function Scale(s: number): Transform2X3 {
            return { scaledOffset: false, xx: s, xy: 0, yx: 0, yy: s, dx: 0, dy: 0 };
        }
    }
    export type GeometryVisitor = GeneralGlyph.GeometryVisitorT<OtGlyph, OtVar.Value>;
    export type ContourVisitor = GeneralGlyph.ContourVisitorT<OtVar.Value>;
    export type PrimitiveVisitor = GeneralGlyph.PrimitiveVisitorT<OtVar.Value>;
    export type ReferenceVisitor = GeneralGlyph.ReferenceVisitorT<OtGlyph, OtVar.Value>;
    export type HintVisitor = GeneralGlyph.HintVisitorT<OtVar.Value>;

    export enum PointType {
        Corner = 0,
        Lead = 1,
        Follow = 2,
        Quad = 3
    }
    export class Point implements GeneralGlyph.Point.T<OtVar.Value> {
        constructor(public x: OtVar.Value, public y: OtVar.Value, public kind: number) {}
        public static create(x: OtVar.Value, y: OtVar.Value, kind: number = PointType.Corner) {
            return new Point(x || 0, y || 0, kind);
        }
    }
    export const PointOps = new GeneralGlyph.Point.OpT(OtVar.Ops, Point);

    export type PointIDRef = {
        readonly pointIndex: number;
    };
    export type GlyphPointIDRef<G> = {
        readonly glyph: G;
        readonly pointIndex: number;
    };
    export type PointRef = {
        readonly geometry: number;
        readonly contour: number;
        readonly index: number;
    };
    export type PointRefW = {
        geometry: number;
        contour: number;
        index: number;
    };
    export namespace PointRef {
        export function compare(a: PointRef, b: PointRef) {
            return a.geometry - b.geometry || a.contour - b.contour || a.index - b.index;
        }
    }
    export type PointAttachment = {
        readonly inner: PointIDRef;
        readonly outer: PointIDRef;
    };

    // Geometry types
    export class ContourSet implements GeneralGlyph.GeometryT<OtGlyph, OtVar.Value> {
        constructor(public contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []) {}
        public visitGeometry(visitor: OtGlyph.GeometryVisitor) {
            const cVisitor = visitor.visitContourSet();
            cVisitor.begin();
            for (let cid = 0; cid < this.contours.length; cid++) {
                const contour = this.contours[cid];
                const zVisitor = cVisitor.visitContour();
                zVisitor.begin();
                for (let zid = 0; zid < contour.length; zid++) {
                    zVisitor.visitPoint(new ContourSetPointPtr(this, cid, zid));
                }
                zVisitor.end();
            }
            cVisitor.end();
        }
        public rectifyCoords(rectify: OtVar.Rectifier) {
            for (const c of this.contours) {
                for (let zid = 0; zid < c.length; zid++) {
                    const z = c[zid];
                    c[zid] = new Point(rectify.coord(z.x), rectify.coord(z.y), z.kind);
                }
            }
        }
        public rectifyGlyphs(rectify: OtGlyph.Rectifier) {}
        public traceGlyphs(tracer: OtGlyph.Tracer) {}
        public rectifyPointAttachment() {}
    }
    class ContourSetPointPtr implements ImpLib.Access<GeneralGlyph.Point.T<OtVar.Value>> {
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

    export class TtReferenceList implements GeneralGlyph.GeometryT<OtGlyph, OtVar.Value> {
        constructor(public references: TtReference[] = []) {}

        public visitGeometry(visitor: OtGlyph.GeometryVisitor) {
            for (const ref of this.references) ref.visitGeometry(visitor);
        }
        public rectifyCoords(rec: OtVar.Rectifier) {
            for (const ref of this.references) ref.rectifyCoords(rec);
        }
        public rectifyGlyphs(rec: OtGlyph.Rectifier) {
            let ref1: TtReference[] = [];
            for (const ref of this.references) {
                const remove = ref.rectifyGlyphs(rec);
                if (!remove) ref1.push(ref);
            }
            this.references = ref1;
            return !ref1.length;
        }
        public traceGlyphs(tracer: OtGlyph.Tracer) {
            for (const ref of this.references) ref.traceGlyphs(tracer);
        }
        public rectifyPointAttachment(
            rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>,
            c: OtGlyph
        ) {
            for (const component of this.references) component.rectifyPointAttachment(rec, c);
        }
    }

    export class TtReference implements GeneralGlyph.GeometryT<OtGlyph, OtVar.Value> {
        constructor(public to: OtGlyph, public transform: Transform2X3) {}
        public roundXyToGrid = false;
        public useMyMetrics = false;
        public overlapCompound = false;
        public pointAttachment: Data.Maybe<PointAttachment> = null;
        public visitGeometry(visitor: OtGlyph.GeometryVisitor) {
            const refVisitor = visitor.visitReference();
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
        public rectifyGlyphs(rectify: OtGlyph.Rectifier) {
            const to1 = rectify.glyph(this.to);
            if (!to1) return true;
            this.to = to1;
            return false;
        }
        public traceGlyphs(tracer: OtGlyph.Tracer) {
            if (!tracer.has(this.to)) {
                tracer.add(this.to);
                this.to.traceGlyphs(tracer);
            }
        }
        public rectifyPointAttachment(
            rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>,
            c: OtGlyph
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
            rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>,
            c: OtGlyph
        ) {
            if (!this.pointAttachment) return null;
            const outerPoint = rec.getGlyphPoint(c, this.pointAttachment.outer.pointIndex);
            const innerPoint = rec.getGlyphPoint(this.to, this.pointAttachment.inner.pointIndex);

            if (!outerPoint || !innerPoint) return null;

            const transformedInner = PointOps.applyTransform(
                Point.create(innerPoint.x, innerPoint.y),
                { ...this.transform, dx: 0, dy: 0 }
            );
            return PointOps.minus(Point.create(outerPoint.x, outerPoint.y), transformedInner);
        }
    }
    class TtReferenceGlyphPtr implements ImpLib.Access<OtGlyph> {
        constructor(private ref: TtReference) {}
        public get() {
            return this.ref.to;
        }
        public set(g: OtGlyph) {
            this.ref.to = g;
        }
    }
    class TtReferenceTransformPtr implements ImpLib.Access<Transform2X3> {
        constructor(private ref: TtReference) {}
        public get() {
            return this.ref.transform;
        }
        public set(tfm: Transform2X3) {
            this.ref.transform = tfm;
        }
    }

    // Hints and hint visitors
    export const TID_TtfInstructionHintVisitor = new Caster.TypeID<TtfInstructionHintVisitor>(
        "OTB::TrueType::TID_TtfInstructionHintVisitor"
    );
    export interface TtfInstructionHintVisitor extends HintVisitor {
        addInstructions(buffer: Buffer): void;
    }
    export class TtfInstructionHint implements GeneralGlyph.HintT<OtVar.Value> {
        constructor(public instructions: Buffer) {}
        public rectifyCoords(rectify: OtVar.Rectifier) {}
        public visitHint(hv: HintVisitor) {
            const visitor = hv.queryInterface(TID_TtfInstructionHintVisitor);
            if (!visitor) return;
            visitor.begin();
            visitor.addInstructions(this.instructions);
            visitor.end();
        }
    }

    export const TID_CffHintVisitor = new Caster.TypeID<CffHintVisitor>(
        "OTB::TrueType::TID_CffHintVisitor"
    );
    export interface CffHintVisitor extends HintVisitor {
        addHorizontalStem(stem: CffHintStem): void;
        addVerticalStem(stem: CffHintStem): void;
        addHintMask(stem: CffHintMask): void;
        addCounterMask(stem: CffHintMask): void;
    }
    export class CffHintStem implements OtVar.Rectifiable {
        constructor(public start: OtVar.Value, public end: OtVar.Value) {}
        public rectifyCoords(rectify: OtVar.Rectifier) {
            this.start = rectify.coord(this.start);
            this.end = rectify.coord(this.end);
        }
    }
    export class CffHintMask {
        constructor(
            public at: PointRef,
            public maskH: Set<CffHintStem>,
            public maskV: Set<CffHintStem>
        ) {}
    }
    export class CffHint implements GeneralGlyph.HintT<OtVar.Value> {
        public hStems: CffHintStem[] = [];
        public vStems: CffHintStem[] = [];
        public hintMasks: CffHintMask[] = [];
        public counterMasks: CffHintMask[] = [];
        public rectifyCoords(rectify: OtVar.Rectifier) {
            for (const hs of this.hStems) hs.rectifyCoords(rectify);
            for (const vs of this.vStems) vs.rectifyCoords(rectify);
        }
        public visitHint(hv: HintVisitor) {
            const visitor = hv.queryInterface(TID_CffHintVisitor);
            if (!visitor) return;
            visitor.begin();
            for (const hs of this.hStems) visitor.addHorizontalStem(hs);
            for (const vs of this.vStems) visitor.addVerticalStem(vs);
            for (const hm of this.hintMasks) visitor.addHintMask(hm);
            for (const cm of this.counterMasks) visitor.addCounterMask(cm);
            visitor.end();
        }
    }

    export import Stat = OtGlyphStat;
    export import CoStat = OtGlyphCoStat;

    // Rectification
    export type Rectifier = Rectify.Glyph.RectifierT<OtGlyph>;
    export type Rectifiable = Rectify.Glyph.RectifiableT<OtGlyph>;

    // Glyph marking
    export type Tracer = Trace.Glyph.TracerT<OtGlyph>;
    export type Traceable = Trace.Glyph.TraceableT<OtGlyph>;
}
