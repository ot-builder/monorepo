import { Data, Rectify, Trace } from "@ot-builder/prelude";

import { Contour as GlyphContour } from "./contour";
import { Metric as GlyphMetric } from "./metric";
import { Point as GlyphPoint } from "./point";
import { Transform2X3 as GlyphTransform2X3 } from "./transform-2x3";

export namespace GeneralGlyph {
    export interface GeometryT<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G> {
        transfer(sink: GeometrySinkT<G, X>): void;
    }

    export interface GeometrySinkT<G, X> {
        addContourSet(): ContourSinkT<X>;
        addReference(ref: ReferenceT<G, X>): void;
    }
    export interface GeometryElementSink {
        begin(): void;
        end(): void;
    }
    export interface ContourSinkT<X> extends GeometryElementSink {
        addContour(): PrimitiveSinkT<X>;
    }
    export interface PrimitiveSinkT<X> extends GeometryElementSink {
        addControlKnot(point: GlyphPoint.T<X>): void;
    }

    export interface T<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G> {
        horizontal: GlyphMetric.T<X>;
        vertical: GlyphMetric.T<X>;
        geometries: GeometryT<G, X>[];
        hints?: Data.Maybe<HintT<X>>;
    }
    export interface ContourSetT<G, X> extends GeometryT<G, X> {
        contours: GlyphContour.T<X>[];
    }
    export interface ReferenceT<G, X> extends GeometryT<G, X> {
        to: G;
        transform: GlyphTransform2X3.T<X>;
    }
    export interface HintT<X> extends Rectify.Coord.RectifiableT<X> {
        readonly kind: string;
    }

    export import Point = GlyphPoint;
    export import Contour = GlyphContour;
    export import Metric = GlyphMetric;
    export import Transform2X3 = GlyphTransform2X3;
}
