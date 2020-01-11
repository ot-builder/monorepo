import { OtGlyph } from "@ot-builder/ft-glyphs";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";
import { DicingStoreImpl } from "../dicing-store";

import { CaseCreator, CaseType, CreateTable } from "./factories";
import * as FeatureParamLib from "./feature-params";
import * as GeneralLookup from "./general/lookup";
import * as LT from "./general/lookup-type";
import * as GeneralGsubGpos from "./general/shared";

export namespace GsubGpos {
    export import General = GeneralGsubGpos;
    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type TableT<L> = GeneralGsubGpos.TableT<OtVar.Dim, OtGlyph, OtVar.Value, L>;
    export type FeatureT<L> = GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value, L>;
    export type LanguageT<L> = GeneralGsubGpos.LanguageT<OtGlyph, OtVar.Value, L>;
    export type ScriptT<L> = GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value, L>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Dim>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Dim>;
    export type FeatureVariationT<L> = GeneralGsubGpos.FeatureVariationT<
        OtVar.Dim,
        OtGlyph,
        OtVar.Value,
        L
    >;

    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type ChainingApplication<E> = GeneralLookup.ChainingApplicationT<E>;
    export type ChainingRule<E> = GeneralLookup.ChainingRuleT<Set<OtGlyph>, E>;
    export type ChainingClassRule<E> = GeneralLookup.ChainingRuleT<number, E>;
    export type ChainingProp<E> = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, E>;

    export type LookupProp = GeneralLookup.LookupPropT<OtGlyph>;
    export import LookupType = LT;
}

export namespace Gsub {
    export const Tag = "GSUB";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type Table = GsubGpos.TableT<Lookup>;
    export const Table = CreateTable<Lookup>();
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

    export type SingleProp = GeneralLookup.GsubSinglePropT<OtGlyph, OtVar.Value>;
    export type Single = CaseType<typeof LT.GsubSingle, SingleProp>;
    export const Single = CaseCreator<typeof LT.GsubSingle, SingleProp>(LT.GsubSingle, () => ({
        mapping: new Map()
    }));

    export type MultipleAlternateProp = GeneralLookup.GsubMultipleAlternatePropT<
        OtGlyph,
        OtVar.Value
    >;
    export type Multiple = CaseType<typeof LT.GsubMulti, MultipleAlternateProp>;
    export const Multiple = CaseCreator<typeof LT.GsubMulti, MultipleAlternateProp>(
        LT.GsubMulti,
        () => ({ mapping: new Map() })
    );
    export type Alternate = CaseType<typeof LT.GsubAlternate, MultipleAlternateProp>;
    export const Alternate = CaseCreator<typeof LT.GsubAlternate, MultipleAlternateProp>(
        LT.GsubAlternate,
        () => ({ mapping: new Map() })
    );

    export type LigatureProp = GeneralLookup.GsubLigaturePropT<OtGlyph, OtVar.Value>;
    export type Ligature = CaseType<typeof LT.GsubLigature, LigatureProp>;
    export const Ligature = CaseCreator<typeof LT.GsubLigature, LigatureProp>(
        LT.GsubLigature,
        () => ({ mapping: [] })
    );

    export type ChainingProp<L> = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, L>;
    export type ChainingT<L> = CaseType<typeof LT.GsubChaining, ChainingProp<L>>;
    export type Chaining = ChainingT<{ ref: Lookup }>;
    export const Chaining = CaseCreator<typeof LT.GsubChaining, ChainingProp<{ ref: Lookup }>>(
        LT.GsubChaining,
        () => ({ rules: [] })
    );

    export type ReverseSubProp = GeneralLookup.GsubReverseSingleSubPropT<OtGlyph, OtVar.Value>;
    export type ReverseSub = CaseType<typeof LT.GsubReverse, ReverseSubProp>;
    export const ReverseSub = CaseCreator<typeof LT.GsubReverse, ReverseSubProp>(
        LT.GsubReverse,
        () => ({ rules: [] })
    );

    export type LookupT<L> = Single | Multiple | Alternate | Ligature | ChainingT<L> | ReverseSub;
    export type Lookup = LookupT<{ ref: Lookup }>;
    export import LookupType = LT;

    // Lookup-internal data types
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type LigatureEntry = GeneralLookup.GsubLigatureLookupEntryT<OtGlyph>;

    export type ChainingApplication<E> = GsubGpos.ChainingApplication<E>;
    export type ChainingRule<E> = GsubGpos.ChainingRule<E>;
    export type ChainingClassRule = GsubGpos.ChainingClassRule<Lookup>;

    export type ReverseRule = GeneralLookup.GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;
}

export namespace Gpos {
    export const Tag = "GPOS";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type Table = GsubGpos.TableT<Lookup>;
    export const Table = CreateTable<Lookup>();
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

    export type SingleProp = GeneralLookup.GposSinglePropT<OtGlyph, OtVar.Value>;
    export type Single = CaseType<typeof LT.GposSingle, SingleProp>;
    export const Single = CaseCreator<typeof LT.GposSingle, SingleProp>(LT.GposSingle, () => ({
        adjustments: new Map()
    }));

    export type PairProp = GeneralLookup.GposPairPropT<OtGlyph, OtVar.Value>;
    export type Pair = CaseType<typeof LT.GposPair, PairProp>;
    export const Pair = CaseCreator<typeof LT.GposPair, PairProp>(LT.GposPair, () => ({
        adjustments: new DicingStoreImpl()
    }));

    export type CursiveProp = GeneralLookup.GposCursivePropT<OtGlyph, OtVar.Value>;
    export type Cursive = CaseType<typeof LT.GposCursive, CursiveProp>;
    export const Cursive = CaseCreator<typeof LT.GposCursive, CursiveProp>(LT.GposCursive, () => ({
        attachments: new Map()
    }));

    export type MarkToBaseProp = GeneralLookup.GposMarkToBasePropT<OtGlyph, OtVar.Value>;
    export type MarkToBase = CaseType<typeof LT.GposMarkToBase, MarkToBaseProp>;
    export const MarkToBase = CaseCreator<typeof LT.GposMarkToBase, MarkToBaseProp>(
        LT.GposMarkToBase,
        () => ({ marks: new Map(), bases: new Map() })
    );
    export type MarkToLigatureProp = GeneralLookup.GposMarkToLigaturePropT<OtGlyph, OtVar.Value>;
    export type MarkToLigature = CaseType<typeof LT.GposMarkToLigature, MarkToLigatureProp>;
    export const MarkToLigature = CaseCreator<typeof LT.GposMarkToLigature, MarkToLigatureProp>(
        LT.GposMarkToLigature,
        () => ({ marks: new Map(), bases: new Map() })
    );
    export type MarkToMarkProp = GeneralLookup.GposMarkToMarkPropT<OtGlyph, OtVar.Value>;
    export type MarkToMark = CaseType<typeof LT.GposMarkToMark, MarkToMarkProp>;
    export const MarkToMark = CaseCreator<typeof LT.GposMarkToMark, MarkToMarkProp>(
        LT.GposMarkToMark,
        () => ({ marks: new Map(), baseMarks: new Map() })
    );

    export type ChainingProp<L> = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, L>;
    export type ChainingT<L> = CaseType<typeof LT.GposChaining, ChainingProp<L>>;
    export type Chaining = ChainingT<{ ref: Lookup }>;
    export const Chaining = CaseCreator<typeof LT.GposChaining, ChainingProp<{ ref: Lookup }>>(
        LT.GposChaining,
        () => ({ rules: [] })
    );

    export type LookupT<L> =
        | Single
        | Pair
        | Cursive
        | MarkToBase
        | MarkToMark
        | MarkToLigature
        | ChainingT<L>;
    export type Lookup = LookupT<{ ref: Lookup }>;
    export import LookupType = LT;

    // Lookup-internal data type aliases
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type Adjustment = LayoutCommon.Adjust.T<OtVar.Value>;
    export type AdjustmentPair = LayoutCommon.Adjust.PairT<OtVar.Value>;
    export type Anchor = LayoutCommon.Anchor.T<OtVar.Value>;
    export type CursiveAnchorPair = LayoutCommon.CursiveAnchorPair.T<OtVar.Value>;

    export type MarkRecord = GeneralLookup.GposMarkRecordT<OtVar.Value>;
    export type BaseRecord = GeneralLookup.GposBaseRecordT<OtVar.Value>;
    export type LigatureBaseRecord = GeneralLookup.GposLigatureBaseRecordT<OtVar.Value>;

    export type ChainingApplication<E> = GsubGpos.ChainingApplication<E>;
    export type ChainingRule<E> = GsubGpos.ChainingRule<E>;
    export type ChainingClassRule = GsubGpos.ChainingClassRule<Lookup>;

    // Zeroes
    export const ZeroAdjustment: Adjustment = { dX: 0, dY: 0, dWidth: 0, dHeight: 0 };
    export const ZeroAdjustmentPair: AdjustmentPair = [ZeroAdjustment, ZeroAdjustment];
}
