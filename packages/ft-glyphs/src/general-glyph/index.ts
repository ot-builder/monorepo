import { Caster, Data, Rectify, Trace } from "@ot-builder/prelude";

import { Contour as GlyphContour } from "./contour";
import { Metric as GlyphMetric } from "./metric";
import { Point as GlyphPoint } from "./point";
import { Transform2X3 as GlyphTransform2X3 } from "./transform-2x3";

export namespace GeneralGlyph {
    // Geometry
    export interface GeometryT<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G> {
        visitGeometry(sink: GeometryVisitorT<G, X>): void;
    }

    // Geometry Visitors
    export interface GeometryElementVisitor {
        begin(): void;
        end(): void;
    }
    export interface GeometryVisitorT<G, X> {
        addContourSet(): ContourVisitorT<X>;
        addReference(): ReferenceVisitorT<G, X>;
    }
    export interface ContourVisitorT<X> extends GeometryElementVisitor {
        addContour(): PrimitiveVisitorT<X>;
    }
    export interface PrimitiveVisitorT<X> extends GeometryElementVisitor {
        addControlKnot(point: GlyphPoint.T<X>): void;
    }
    export interface ReferenceVisitorT<G, X> extends GeometryElementVisitor {
        setTarget(glyph: G): void;
        setTransform(tfm: GlyphTransform2X3.T<X>): void;
        setFlag(name: string, on: boolean): void;
        setPointAttachment(innerPointID: number, outerPointID: number): void;
    }

    // Hint visitors
    export interface HintVisitorT<X> extends Caster.IUnknown, GeometryElementVisitor {}

    export interface T<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G> {
        horizontal: GlyphMetric.T<X>;
        vertical: GlyphMetric.T<X>;
        geometries: GeometryT<G, X>[];
        hints?: Data.Maybe<HintT<X>>;
    }
    export interface HintT<X> extends Rectify.Coord.RectifiableT<X> {
        visitHint(visitor: HintVisitorT<X>): void;
    }

    export import Point = GlyphPoint;
    export import Contour = GlyphContour;
    export import Metric = GlyphMetric;
    export import Transform2X3 = GlyphTransform2X3;
}
