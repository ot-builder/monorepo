import { Access, Caster, Data, Thunk } from "@ot-builder/prelude";

import { Contour as GlyphContour } from "./contour";
import { Metric as GlyphMetric } from "./metric";
import * as Lib_General_Point from "./point";
import { Transform2X3 as GlyphTransform2X3 } from "./transform-2x3";

export namespace GeneralGlyph {
    // Geometry
    export interface GeometryT<G, X> extends Caster.IUnknown {
        acceptGeometryAlgebra<E>(alg: GeometryAlgT<G, X, E>): E;
    }
    export interface ContourSetPropsT<G, X> {
        contours: Contour.T<X>[];
    }
    export interface ContourSetT<G, X> extends ContourSetPropsT<G, X>, GeometryT<G, X> {}
    export interface TtReferencePropsT<G, X> {
        to: G;
        transform: Transform2X3.T<X>;
        roundXyToGrid: boolean;
        useMyMetrics: boolean;
        overlapCompound: boolean;
        pointAttachment: Data.Maybe<Lib_General_Point.PointAttachment>;
    }
    export interface TtReferenceT<G, X> extends TtReferencePropsT<G, X>, GeometryT<G, X> {}
    export interface GeometryListT<G, X> extends GeometryT<G, X> {
        items: GeometryT<G, X>[];
    }

    // Geometry algebra
    export interface GeometryAlgT<G, X, E> {
        contourSet(g: ContourSetPropsT<G, X>): E;
        ttReference(g: TtReferencePropsT<G, X>): E;
        geometryList(parts: E[]): E;
    }

    // Hint type
    export interface HintT<X> extends Caster.IUnknown {
        acceptHintAlgebra<E>(alg: HintAlgT<X, E>): E;
    }
    export interface TtInstructionPropsT<X> {
        instructions: Buffer;
    }
    export interface TtInstructionHintT<X> extends TtInstructionPropsT<X>, HintT<X> {}
    export interface CffHintStemT<X> {
        start: X;
        end: X;
    }
    export interface CffHintMaskT<X> {
        at: Lib_General_Point.PointRef;
        maskH: Set<CffHintStemT<X>>;
        maskV: Set<CffHintStemT<X>>;
    }
    export interface CffHintPropsT<X> {
        hStems: CffHintStemT<X>[];
        vStems: CffHintStemT<X>[];
        hintMasks: CffHintMaskT<X>[];
        counterMasks: CffHintMaskT<X>[];
    }
    export interface CffHintT<X> extends CffHintPropsT<X>, HintT<X> {}

    // Hint algebra
    export interface HintAlgT<X, E> {
        ttInstructions(g: TtInstructionPropsT<X>): E;
        cffHint(h: CffHintPropsT<X>): E;
    }

    // Glyph types
    export interface GlyphT<G, X> {
        horizontal: GlyphMetric.T<X>;
        vertical: GlyphMetric.T<X>;
        geometry: Data.Maybe<GeometryT<G, X>>;
        hints?: Data.Maybe<HintT<X>>;

        acceptGlyphAlgebra<E, EG, EH>(alg: GlyphAlgT<G, X, E, EG, EH>): E;
    }

    // Glyph algebra
    export interface GlyphAlgT<G, X, E, EG = E, EH = E> {
        geometryAlgebra: Data.Maybe<GeometryAlgT<G, X, EG>>;
        hintAlgebra: Data.Maybe<HintAlgT<X, EH>>;
        glyph(
            horizontal: GlyphMetric.T<X>,
            vertical: GlyphMetric.T<X>,
            fnGeometry: Data.Maybe<Thunk<EG>>,
            fnHints: Data.Maybe<Thunk<EH>>
        ): E;
    }

    // Re-exports
    export import Point = Lib_General_Point.Point;
    export import Contour = GlyphContour;
    export import Metric = GlyphMetric;
    export import Transform2X3 = GlyphTransform2X3;

    export import GlyphPointIDRefT = Lib_General_Point.GlyphPointIDRef;
}
