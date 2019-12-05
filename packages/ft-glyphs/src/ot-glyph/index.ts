import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import * as Lib_CffHint from "./cff-hint";
import { OtGlyphCoStat } from "./co-stat";
import * as Lib_ContourSet from "./contour-set";
import * as Lib_GeometryList from "./geometry-list";
import * as Lib_GlyphImpl from "./glyph-impl";
import * as Lib_Glyph from "./glyph-interface";
import * as Lib_Point from "./point";
import { OtGlyphStat } from "./stat";
import * as Lib_TtInstr from "./tt-instr";
import * as Lib_TtReference from "./tt-reference";

export type OtGlyph = Lib_Glyph.OtGlyphInterface;
export namespace OtGlyph {
    export function create(): Lib_Glyph.OtGlyphInterface {
        return new Lib_GlyphImpl.OtGlyphImpl();
    }

    // Exported geometry types
    export type Geometry = GeneralGlyph.GeometryT<OtGlyph, OtVar.Value>;
    export type ContourSetGeometry = GeneralGlyph.ContourSetGeometryT<OtGlyph, OtVar.Value>;
    export type ContourShape = GeneralGlyph.ContourShapeT<OtGlyph, OtVar.Value>;
    export type ReferenceGeometry = GeneralGlyph.ReferenceGeometryT<OtGlyph, OtVar.Value>;
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

    // Exported visitor types
    export type ScopedVisitor = GeneralGlyph.ScopedVisitor;
    export type GeometryVisitor = GeneralGlyph.GeometryVisitorT<OtGlyph, OtVar.Value>;
    export type ContourSetVisitor = GeneralGlyph.ContourSetVisitorT<OtGlyph, OtVar.Value>;
    export type ContourVisitor = GeneralGlyph.ContourVisitorT<OtGlyph, OtVar.Value>;
    export type ReferenceVisitor = GeneralGlyph.ReferenceVisitorT<OtGlyph, OtVar.Value>;
    export type HintVisitor = GeneralGlyph.HintVisitorT<OtVar.Value>;

    // Point re-exports
    export import PointType = Lib_Point.PointType;
    export import Point = Lib_Point.CPoint;
    export import PointOps = Lib_Point.PointOps;
    export import Contour = Lib_Point.Contour;
    export import PointIDRef = Lib_Point.PointIDRef;
    export import GlyphPointIDRef = Lib_Point.GlyphPointIDRef;
    export import PointRef = Lib_Point.PointRef;
    export import PointRefW = Lib_Point.PointRefW;
    export import PointAttachment = Lib_Point.PointAttachment;

    // Geometry types
    export import ContourSet = Lib_ContourSet.ContourSet;
    export import GeometryList = Lib_GeometryList.GeometryList;
    export import TtReference = Lib_TtReference.TtReference;

    // TTF hints
    export import TID_TtfInstructionHintVisitor = Lib_TtInstr.TID_TtfInstructionHintVisitor;
    export import TtfInstructionHintVisitor = Lib_TtInstr.TtfInstructionHintVisitor;
    export import TtfInstructionHint = Lib_TtInstr.TtfInstructionHint;

    // CFF hints
    export import TID_CffHintVisitor = Lib_CffHint.TID_CffHintVisitor;
    export import CffHintVisitor = Lib_CffHint.CffHintVisitor;
    export import CffHintStem = Lib_CffHint.CffHintStem;
    export import CffHintMask = Lib_CffHint.CffHintMask;
    export import CffHint = Lib_CffHint.CffHint;

    // Stat
    export import Stat = OtGlyphStat;
    export import CoStat = OtGlyphCoStat;
}
