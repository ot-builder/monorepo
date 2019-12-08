import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";
import * as Lib_General_Point from "../general-glyph/point";

import { CffHintImpl, CffHintMaskImpl, CffHintStemImpl } from "./cff-hint";
import { OtGlyphCoStat } from "./co-stat";
import { ContourSetImpl } from "./contour-set";
import { GeometryListImpl } from "./geometry-list";
import { OtGlyphImpl } from "./glyph-impl";
import { OtGlyphInterface } from "./glyph-interface";
import * as Lib_Point from "./point";
import { OtGlyphStat } from "./stat";
import { TtInstructionHintImpl } from "./tt-instr";
import { TtReferenceImpl } from "./tt-reference";
import * as TypeID from "./type-id";

export type OtGlyph = OtGlyphInterface;
export namespace OtGlyph {
    export function create(): OtGlyphInterface {
        return new OtGlyphImpl();
    }

    // Exported geometry types
    export type Geometry = GeneralGlyph.GeometryT<OtGlyph, OtVar.Value>;
    export type ContourSet = GeneralGlyph.ContourSetT<OtGlyph, OtVar.Value>;
    export type ContourSetProps = GeneralGlyph.ContourSetPropsT<OtGlyph, OtVar.Value>;
    export namespace ContourSet {
        export function create(contours: GeneralGlyph.Contour.T<OtVar.Value>[] = []): ContourSet {
            return new ContourSetImpl(contours);
        }
    }
    export type GeometryList = GeneralGlyph.GeometryListT<OtGlyph, OtVar.Value>;
    export namespace GeometryList {
        export function create(items: Geometry[] = []): GeometryList {
            return new GeometryListImpl(items);
        }
    }
    export type TtReference = GeneralGlyph.TtReferenceT<OtGlyph, OtVar.Value>;
    export type TtReferenceProps = GeneralGlyph.TtReferencePropsT<OtGlyph, OtVar.Value>;
    export namespace TtReference {
        export function create(to: OtGlyphInterface, transform: Transform2X3): TtReference {
            return new TtReferenceImpl(to, transform);
        }
    }
    export type Hint = GeneralGlyph.HintT<OtVar.Value>;
    export type TtInstructionHint = GeneralGlyph.TtInstructionHintT<OtVar.Value>;
    export type TtInstructionProps = GeneralGlyph.TtInstructionPropsT<OtVar.Value>;
    export namespace TtInstructionHint {
        export function create(instructions: Buffer): TtInstructionHint {
            return new TtInstructionHintImpl(instructions);
        }
    }
    export type CffHint = GeneralGlyph.CffHintT<OtVar.Value>;
    export type CffHintProps = GeneralGlyph.CffHintPropsT<OtVar.Value>;
    export type CffHintStem = GeneralGlyph.CffHintStemT<OtVar.Value>;
    export type CffHintMask = GeneralGlyph.CffHintMaskT<OtVar.Value>;
    export namespace CffHint {
        export function create(): CffHint {
            return new CffHintImpl();
        }
        export function createStem(start: OtVar.Value, end: OtVar.Value): CffHintStem {
            return new CffHintStemImpl(start, end);
        }
        export function createMask(at: PointRef, maskH: Set<CffHintStem>, maskV: Set<CffHintStem>) {
            return new CffHintMaskImpl(at, maskH, maskV);
        }
    }

    // Exported visitor types
    export type GlyphAlg<E, EG = E, EH = E> = GeneralGlyph.GlyphAlgT<
        OtGlyph,
        OtVar.Value,
        E,
        EG,
        EH
    >;
    export type GeometryAlg<E> = GeneralGlyph.GeometryAlgT<OtGlyph, OtVar.Value, E>;
    export type HintAlg<E> = GeneralGlyph.HintAlgT<OtVar.Value, E>;

    // Point re-exports
    export import PointType = Lib_Point.PointType;
    export import Point = Lib_Point.CPoint;
    export import PointOps = Lib_Point.PointOps;
    export type Contour = GeneralGlyph.Contour.T<OtVar.Value>;
    export import PointIDRef = Lib_General_Point.PointIDRef;
    export import GlyphPointIDRef = Lib_General_Point.GlyphPointIDRef;
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
    export const TID_Glyph = TypeID.TID_Glyph;
    export const TID_ContourSet = TypeID.TID_ContourSet;
    export const TID_GeometryList = TypeID.TID_GeometryList;
    export const TID_TtReference = TypeID.TID_TtReference;
    export const TID_TtInstructionHint = TypeID.TID_TtInstructionHint;
    export const TID_CffHint = TypeID.TID_CffHint;
}
