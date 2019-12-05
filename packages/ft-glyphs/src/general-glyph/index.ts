import { Access, Caster, Data, Rectify, Trace } from "@ot-builder/prelude";

import { Contour as GlyphContour } from "./contour";
import { Metric as GlyphMetric } from "./metric";
import { Point as GlyphPoint } from "./point";
import { Transform2X3 as GlyphTransform2X3 } from "./transform-2x3";

export namespace GeneralGlyph {
    // Geometry
    export interface GeometryT<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G>,
            Rectify.PointAttach.TerminalT<G, X> {
        acceptGeometryVisitor(sink: GeometryVisitorT<G, X>): void;
        duplicate(): GeometryT<G, X>;
    }
    export interface ContourSetGeometryT<G, X> extends GeometryT<G, X> {
        acceptContourSetVisitor(contourSetVisitor: ContourSetVisitorT<G, X>): void;
        listContours(): Iterable<ContourShapeT<G, X>>;
    }
    export interface ContourShapeT<G, X> {
        acceptContourVisitor(cv: ContourVisitorT<G, X>): void;
        listPoints(): Iterable<GlyphPoint.T<X>>;
        listPointAccesses(): Iterable<Access<GlyphPoint.T<X>>>;
    }
    export interface ReferenceGeometryT<G, X> extends GeometryT<G, X> {
        acceptReferenceVisitor(refVisitor: ReferenceVisitorT<G, X>): void;
    }

    // Geometry Visitor
    export interface ScopedVisitor {
        begin(): void;
        end(): void;
    }
    export interface GeometryVisitorT<G, X> extends ScopedVisitor {
        visitContourSet(cg: ContourSetGeometryT<G, X>): void;
        visitReference(rg: ReferenceGeometryT<G, X>): void;
    }
    export interface ContourSetVisitorT<G, X> extends ScopedVisitor {
        visitContourSet(cg: ContourSetGeometryT<G, X>): void;
    }
    export interface ContourVisitorT<G, X> extends ScopedVisitor {
        visitContour(sh: ContourShapeT<G, X>): void;
    }
    export interface ReferenceVisitorT<G, X> extends ScopedVisitor {
        visitTarget(glyph: Access<G>): void;
        visitTransform(tfm: Access<GlyphTransform2X3.T<X>>): void;
        setFlag(name: string, on: boolean): void;
        setPointAttachment(innerPointID: number, outerPointID: number): void;
    }

    // Hint type
    export interface HintT<X> extends Rectify.Coord.RectifiableT<X> {
        acceptHintVisitor(visitor: HintVisitorT<X>): void;
        duplicate(): HintT<X>;
    }

    // Hint visitor
    export interface HintVisitorT<X> extends Caster.IUnknown, ScopedVisitor {}

    // Glyph types
    export interface GlyphT<G, X>
        extends Rectify.Coord.RectifiableT<X>,
            Rectify.Glyph.RectifiableT<G>,
            Trace.Glyph.TraceableT<G> {
        horizontal: GlyphMetric.T<X>;
        vertical: GlyphMetric.T<X>;
        geometry: Data.Maybe<GeometryT<G, X>>;
        hints?: Data.Maybe<HintT<X>>;
    }

    // Re-exports
    export import Point = GlyphPoint;
    export import Contour = GlyphContour;
    export import Metric = GlyphMetric;
    export import Transform2X3 = GlyphTransform2X3;
}
