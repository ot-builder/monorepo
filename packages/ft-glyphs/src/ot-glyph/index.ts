import { Data } from "@ot-builder/prelude";
import { Rectify, Trace } from "@ot-builder/rectify";
import { OtVar, OV } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphCoStat } from "./co-stat";
import { OtGlyphStat } from "./stat";

export class OtGlyph
    implements GeneralGlyph.T<OtGlyph, OtVar.Value>, GeneralGlyph.GeometryT<OtGlyph, OtVar.Value> {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometries: OtGlyph.Geometry[] = [];
    public hints: Data.Maybe<OtGlyph.Hint> = null;

    public transfer(sink: OtGlyph.GeometrySink) {
        for (const geometry of this.geometries) geometry.transfer(sink);
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
        for (const geometry of this.geometries) geometry.rectifyCoords(rectify);
        if (this.hints) this.hints.rectifyCoords(rectify);
    }

    public rectifyGlyphs(rectify: OtGlyph.Rectifier) {
        let geom1: OtGlyph.Geometry[] = [];
        for (const geom of this.geometries) {
            const removed = geom.rectifyGlyphs(rectify);
            if (!removed) geom1.push(geom);
        }
        this.geometries = geom1;
    }

    public traceGlyphs(tracer: OtGlyph.Tracer) {
        if (!tracer.has(this)) return;
        for (const geom of this.geometries) geom.traceGlyphs(tracer);
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
    export type GeometrySink = GeneralGlyph.GeometrySinkT<OtGlyph, OtVar.Value>;
    export type ContourSink = GeneralGlyph.ContourSinkT<OtVar.Value>;
    export type PrimitiveSink = GeneralGlyph.PrimitiveSinkT<OtVar.Value>;

    export class Point implements GeneralGlyph.Point.T<OtVar.Value> {
        constructor(public x: OtVar.Value, public y: OtVar.Value, public kind: number) {}
        public static create(x: OtVar.Value, y: OtVar.Value, kind: number) {
            return new Point(x, y, kind);
        }
    }
    export const PointOps = new GeneralGlyph.Point.OpT(OV, Point);

    export class ContourSet implements GeneralGlyph.ContourSetT<OtGlyph, OtVar.Value> {
        constructor(public contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []) {}
        public transfer(sink: OtGlyph.GeometrySink) {
            const csSink = sink.addContourSet();
            csSink.begin();
            for (const contour of this.contours) {
                const cSink = csSink.addContour();
                cSink.begin();
                for (const z of contour) cSink.addControlKnot(z);
                cSink.end();
            }
            csSink.end();
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
    }

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
    export type PointRefW = Data.Writable<PointRef>;

    export namespace PointRef {
        export function compare(a: PointRef, b: PointRef) {
            return a.geometry - b.geometry || a.contour - b.contour || a.index - b.index;
        }
    }
    export type PointAttachment = {
        readonly inner: PointIDRef;
        readonly outer: PointIDRef;
    };

    export type Reference = GeneralGlyph.ReferenceT<OtGlyph, OtVar.Value>;
    export class TtReference implements GeneralGlyph.ReferenceT<OtGlyph, OtVar.Value> {
        constructor(public to: OtGlyph, public transform: Transform2X3) {}
        public roundXyToGrid = false;
        public useMyMetrics = false;
        public overlapCompound = false;
        public pointAttachment: Data.Maybe<PointAttachment> = null;
        public transfer(sink: OtGlyph.GeometrySink) {
            sink.addReference(this);
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
    }

    // Hints
    export class TtfInstructionHint implements GeneralGlyph.HintT<OtVar.Value> {
        public readonly kind = "TrueType.Instruction";
        constructor(public instructions: Buffer) {}
        public rectifyCoords(rectify: OtVar.Rectifier) {}
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
        public readonly kind = "Cff.Hints";
        public hStems: CffHintStem[] = [];
        public vStems: CffHintStem[] = [];
        public hintMasks: CffHintMask[] = [];
        public counterMasks: CffHintMask[] = [];
        public rectifyCoords(rectify: OtVar.Rectifier) {
            for (const hs of this.hStems) hs.rectifyCoords(rectify);
            for (const vs of this.vStems) vs.rectifyCoords(rectify);
        }
    }

    export enum PointType {
        Corner = 0,
        Lead = 1,
        Follow = 2,
        Quad = 3
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
