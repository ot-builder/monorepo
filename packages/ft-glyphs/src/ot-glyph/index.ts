import { CaseType, Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";
import * as Lib_General_Point from "../general-glyph/point";
import * as TAG from "../general-glyph/type-tags";

import { CffHintMaskImpl, CffHintStemImpl } from "./cff-hint";
import { OtGlyphCoStat } from "./co-stat";
import * as Lib_Point from "./point";
import { OtGlyphStat } from "./stat";

export interface OtGlyph {
    name?: string;
    horizontal: GeneralGlyph.Metric.T<OtVar.Value>;
    vertical: GeneralGlyph.Metric.T<OtVar.Value>;
    geometry: Data.Maybe<OtGlyph.Geometry>;
    hints: Data.Maybe<OtGlyph.Hint>;
}
export namespace OtGlyph {
    export function create(): OtGlyph {
        return new OtGlyphImpl();
    }

    // Exported geometry types
    export type GeometryT<E> = ContourSet | TtReference | GeometryListT<E>;
    export type Geometry = GeometryT<{ ref: Geometry }>;

    export type ContourSetProps = GeneralGlyph.ContourSetPropsT<OtGlyph, OtVar.Value>;
    export type ContourSet = CaseType<typeof TAG.GeometryType.ContourSet, ContourSetProps>;
    export namespace ContourSet {
        export function create(contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []): ContourSet {
            return { type: TAG.GeometryType.ContourSet, contours };
        }
    }

    export type GeometryListProps<E> = GeneralGlyph.GeometryListPropsT<OtGlyph, OtVar.Value, E>;
    export type GeometryListT<E> = CaseType<
        typeof TAG.GeometryType.GeometryList,
        GeometryListProps<E>
    >;
    export type GeometryList = GeometryListT<{ ref: Geometry }>;
    export namespace GeometryList {
        export function create(items: Geometry[] = []): GeometryList {
            return {
                type: TAG.GeometryType.GeometryList,
                items: items.map(geom => ({ ref: geom }))
            };
        }
    }

    export type TtReferenceProps = GeneralGlyph.TtReferencePropsT<OtGlyph, OtVar.Value>;
    export type TtReference = CaseType<typeof TAG.GeometryType.TtReference, TtReferenceProps>;
    export namespace TtReference {
        export function create(to: OtGlyph, transform: Transform2X3): TtReference {
            return { type: TAG.GeometryType.TtReference, to, transform };
        }
    }

    // Exported hint types
    export type Hint = TtInstruction | CffHint;

    export type TtInstructionProps = GeneralGlyph.TtInstructionPropsT<OtVar.Value>;
    export type TtInstruction = CaseType<typeof TAG.HintType.TtInstruction, TtInstructionProps>;
    export namespace TtInstruction {
        export function create(instructions: Buffer): TtInstruction {
            return { type: TAG.HintType.TtInstruction, instructions };
        }
    }
    export type CffHintProps = GeneralGlyph.CffHintPropsT<OtVar.Value>;
    export type CffHint = CaseType<typeof TAG.HintType.CffHint, CffHintProps>;
    export type CffHintStem = GeneralGlyph.CffHintStemT<OtVar.Value>;
    export type CffHintMask = GeneralGlyph.CffHintMaskT<OtVar.Value>;
    export namespace CffHint {
        export function create(): CffHint {
            return {
                type: TAG.HintType.CffHint,
                hStems: [],
                vStems: [],
                hintMasks: [],
                counterMasks: []
            };
        }
        export function createStem(start: OtVar.Value, end: OtVar.Value): CffHintStem {
            return new CffHintStemImpl(start, end);
        }
        export function createMask(
            at: PointRef,
            maskH: Set<CffHintStem>,
            maskV: Set<CffHintStem>
        ) {
            return new CffHintMaskImpl(at, maskH, maskV);
        }
    }

    // Point re-exports
    export import PointType = Lib_Point.PointType;
    export type Point = GeneralGlyph.Point.T<OtVar.Value>;
    export namespace Point {
        export function create(
            x: OtVar.Value,
            y: OtVar.Value,
            kind: number = PointType.Corner
        ): Point {
            return new Lib_Point.CPoint(x || 0, y || 0, kind);
        }
    }
    export import PointOps = Lib_Point.PointOps;
    export type Contour = GeneralGlyph.Contour.T<OtVar.Value>;
    export import PointIDRef = Lib_General_Point.PointIDRef;
    export type GlyphPointIDRef = Lib_General_Point.GlyphPointIDRef<OtGlyph>;
    export import PointRef = Lib_General_Point.PointRef;
    export import PointRefW = Lib_General_Point.PointRefW;
    export import PointAttachment = Lib_General_Point.PointAttachment;

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

    // Stat
    export import Stat = OtGlyphStat;
    export import CoStat = OtGlyphCoStat;

    export import GeometryType = TAG.GeometryType;
    export import HintType = TAG.HintType;
}

class OtGlyphImpl implements OtGlyph {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometry: Data.Maybe<OtGlyph.Geometry> = null;
    public hints: Data.Maybe<OtGlyph.Hint> = null;
}
