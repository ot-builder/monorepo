import { CaseCreator, CaseType, Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import * as GeneralGlyph from "../general-glyph";
import * as Lib_General_Point from "../general-glyph/point/ref";
import * as TAG_GeometryType from "../general-glyph/type-tags/geometry-type";
import * as TAG_HintType from "../general-glyph/type-tags/hint-type";

import * as OtGlyphCoStat from "./co-stat";
import * as Lib_Point from "./point";
import * as OtGlyphStat from "./stat";

// This dual-export is intensional.

export class OtGlyph {
    public name?: string;
    public horizontal: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public vertical: GeneralGlyph.Metric.T<OtVar.Value> = { start: 0, end: 0 };
    public geometry: Data.Maybe<OtGlyph.Geometry> = null;
    public hints: Data.Maybe<OtGlyph.Hint> = null;

    public static shallowCopy(g: OtGlyph) {
        const g1 = new OtGlyph();
        g1.name = g.name;
        g1.horizontal = g.horizontal;
        g1.vertical = g.vertical;
        g1.geometry = g.geometry;
        g1.hints = g.hints;
        return g1;
    }
}

export namespace OtGlyph {
    // Exported geometry types
    export type Geometry = ContourSet | TtReference | GeometryList;

    export type ContourSetProps = GeneralGlyph.ContourSetPropsT<OtVar.Value>;
    export type ContourSet = CaseType<typeof TAG_GeometryType.ContourSet, ContourSetProps>;
    export const ContourSet = CaseCreator(
        TAG_GeometryType.ContourSet,
        (contours: Contour[] = []): ContourSetProps => ({ contours: [...contours] })
    );

    export type GeometryListProps = GeneralGlyph.GeometryListPropsT<Geometry>;
    export type GeometryList = CaseType<typeof TAG_GeometryType.GeometryList, GeometryListProps>;
    export const GeometryList = CaseCreator(
        TAG_GeometryType.GeometryList,
        (items: Geometry[] = []): GeometryListProps => ({ items: [...items] })
    );

    export type TtReferenceProps = GeneralGlyph.TtReferencePropsT<OtGlyph, OtVar.Value>;
    export type TtReference = CaseType<typeof TAG_GeometryType.TtReference, TtReferenceProps>;
    export const TtReference = CaseCreator(
        TAG_GeometryType.TtReference,
        (to: OtGlyph, transform: Transform2X3): TtReferenceProps => ({ to, transform })
    );

    // Exported hint types
    export type Hint = TtInstruction | CffHint;

    export type TtInstructionProps = GeneralGlyph.TtInstructionPropsT<OtVar.Value>;
    export type TtInstruction = CaseType<typeof TAG_HintType.TtInstruction, TtInstructionProps>;
    export const TtInstruction = CaseCreator(
        TAG_HintType.TtInstruction,
        (instructions: Buffer): TtInstructionProps => ({ instructions })
    );

    export type CffHintProps = GeneralGlyph.CffHintPropsT<OtVar.Value>;
    export type CffHint = CaseType<typeof TAG_HintType.CffHint, CffHintProps>;
    export type CffHintStem = GeneralGlyph.CffHintStemT<OtVar.Value>;
    export type CffHintMask = GeneralGlyph.CffHintMaskT<OtVar.Value>;
    export const CffHint = Object.assign(
        CaseCreator(
            TAG_HintType.CffHint,
            (): CffHintProps => ({
                hStems: [],
                vStems: [],
                hintMasks: [],
                counterMasks: []
            })
        ),
        {
            createStem(start: OtVar.Value, end: OtVar.Value): CffHintStem {
                return { start, end };
            },
            createMask(
                at: PointRef,
                maskH: Set<CffHintStem>,
                maskV: Set<CffHintStem>
            ): CffHintMask {
                return { at, maskH, maskV };
            }
        }
    );

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
        export const Identity: Transform2X3 = {
            scaledOffset: false,
            xx: 1,
            yx: 0,
            xy: 0,
            yy: 1,
            dx: 0,
            dy: 0
        };

        export function Scale(s: number): Transform2X3 {
            return { scaledOffset: false, xx: s, yx: 0, xy: 0, yy: s, dx: 0, dy: 0 };
        }
        export function Translate(dx: OtVar.Value, dy: OtVar.Value): Transform2X3 {
            return { scaledOffset: false, xx: 1, yx: 0, xy: 0, yy: 1, dx: dx, dy: dy };
        }
        export function Rotate(angle: number): Transform2X3 {
            const c = Math.cos(angle),
                s = Math.sin(angle);
            return { scaledOffset: false, xx: c, yx: -s, xy: s, yy: c, dx: 0, dy: 0 };
        }
    }

    // Stat
    export import Stat = OtGlyphStat;
    export import CoStat = OtGlyphCoStat;

    export import GeometryType = TAG_GeometryType;
    export import HintType = TAG_HintType;
}
