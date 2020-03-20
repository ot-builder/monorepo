import { Data, Thunk } from "@ot-builder/prelude";

import { Contour as GlyphContour } from "./contour";
import { Metric as GlyphMetric } from "./metric";
import * as Lib_General_Point from "./point";
import { Transform2X3 as GlyphTransform2X3 } from "./transform-2x3";

export namespace GeneralGlyph {
    // Geometry
    export interface ContourSetPropsT<X> {
        contours: Contour.T<X>[];
    }
    export interface TtReferencePropsT<G, X> {
        to: G;
        transform: Transform2X3.T<X>;
        roundXyToGrid?: boolean;
        useMyMetrics?: boolean;
        overlapCompound?: boolean;
        pointAttachment?: Data.Maybe<Lib_General_Point.PointAttachment>;
    }
    export interface GeometryListPropsT<E> {
        items: E[];
    }

    // Hint
    export interface TtInstructionPropsT<X> {
        instructions: Buffer;
    }
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

    // Re-exports
    export import Point = Lib_General_Point.Point;
    export import Contour = GlyphContour;
    export import Metric = GlyphMetric;
    export import Transform2X3 = GlyphTransform2X3;

    export import GlyphPointIDRefT = Lib_General_Point.GlyphPointIDRef;
}
