import { Data } from "@ot-builder/prelude";

import * as Contour from "./contour";
import * as Lib_General_Point from "./point/ref";
import * as Transform2X3 from "./transform-2x3";

export * as Contour from "./contour";
export * as Metric from "./metric";
export * as Point from "./point/point";
export { GlyphPointIDRef as GlyphPointIDRefT } from "./point/ref";
export * as Transform2X3 from "./transform-2x3";

// Geometry
export interface ContourSetPropsT<X> {
    contours: Contour.T<X>[];
}
export interface TtReferencePropsT<G, X> {
    to: G;
    transform: Transform2X3.T<X>;
    roundXyToGrid?: boolean;
    useMyMetrics?: boolean;
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
