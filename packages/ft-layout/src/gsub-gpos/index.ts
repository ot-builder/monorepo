import { OtGlyph } from "@ot-builder/ft-glyphs";
import { CaseCreator, CaseType } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";
import { DicingStoreImpl, DicingStore } from "../dicing-store";

import { CreateTable } from "./factories";
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
    export type Single = CaseType<typeof LT.Gsub.Single, SingleProp>;
    export const Single = CaseCreator<typeof LT.Gsub.Single, SingleProp>(LT.Gsub.Single, () => ({
        mapping: new Map()
    }));

    export type MultipleAlternateProp = GeneralLookup.GsubMultipleAlternatePropT<
        OtGlyph,
        OtVar.Value
    >;
    export type Multiple = CaseType<typeof LT.Gsub.Multi, MultipleAlternateProp>;
    export const Multiple = CaseCreator<typeof LT.Gsub.Multi, MultipleAlternateProp>(
        LT.Gsub.Multi,
        () => ({ mapping: new Map() })
    );
    export type Alternate = CaseType<typeof LT.Gsub.Alternate, MultipleAlternateProp>;
    export const Alternate = CaseCreator<typeof LT.Gsub.Alternate, MultipleAlternateProp>(
        LT.Gsub.Alternate,
        () => ({ mapping: new Map() })
    );

    export type LigatureProp = GeneralLookup.GsubLigaturePropT<OtGlyph, OtVar.Value>;
    export type Ligature = CaseType<typeof LT.Gsub.Ligature, LigatureProp>;
    export const Ligature = CaseCreator<typeof LT.Gsub.Ligature, LigatureProp>(
        LT.Gsub.Ligature,
        () => ({ mapping: [] })
    );

    export type ChainingProp = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, Lookup>;
    export type Chaining = CaseType<typeof LT.Gsub.Chaining, ChainingProp>;
    export const Chaining = CaseCreator<typeof LT.Gsub.Chaining, ChainingProp>(
        LT.Gsub.Chaining,
        () => ({ rules: [] })
    );

    export type ReverseSubProp = GeneralLookup.GsubReverseSingleSubPropT<OtGlyph, OtVar.Value>;
    export type ReverseSub = CaseType<typeof LT.Gsub.Reverse, ReverseSubProp>;
    export const ReverseSub = CaseCreator<typeof LT.Gsub.Reverse, ReverseSubProp>(
        LT.Gsub.Reverse,
        () => ({ rules: [] })
    );

    export type Lookup = Single | Multiple | Alternate | Ligature | Chaining | ReverseSub;
    export import LookupType = LT.Gsub;

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
    export type Single = CaseType<typeof LT.Gpos.Single, SingleProp>;
    export const Single = CaseCreator<typeof LT.Gpos.Single, SingleProp>(LT.Gpos.Single, () => ({
        adjustments: new Map()
    }));

    export type PairProp = GeneralLookup.GposPairPropT<OtGlyph, OtVar.Value>;
    export type Pair = CaseType<typeof LT.Gpos.Pair, PairProp>;
    export const Pair = CaseCreator<typeof LT.Gpos.Pair, PairProp>(LT.Gpos.Pair, () => ({
        adjustments: DicingStore.create()
    }));

    export type CursiveProp = GeneralLookup.GposCursivePropT<OtGlyph, OtVar.Value>;
    export type Cursive = CaseType<typeof LT.Gpos.Cursive, CursiveProp>;
    export const Cursive = CaseCreator<typeof LT.Gpos.Cursive, CursiveProp>(
        LT.Gpos.Cursive,
        () => ({
            attachments: new Map()
        })
    );

    export type MarkToBaseProp = GeneralLookup.GposMarkToBasePropT<OtGlyph, OtVar.Value>;
    export type MarkToBase = CaseType<typeof LT.Gpos.MarkToBase, MarkToBaseProp>;
    export const MarkToBase = CaseCreator<typeof LT.Gpos.MarkToBase, MarkToBaseProp>(
        LT.Gpos.MarkToBase,
        () => ({ marks: new Map(), bases: new Map() })
    );
    export type MarkToLigatureProp = GeneralLookup.GposMarkToLigaturePropT<OtGlyph, OtVar.Value>;
    export type MarkToLigature = CaseType<typeof LT.Gpos.MarkToLigature, MarkToLigatureProp>;
    export const MarkToLigature = CaseCreator<typeof LT.Gpos.MarkToLigature, MarkToLigatureProp>(
        LT.Gpos.MarkToLigature,
        () => ({ marks: new Map(), bases: new Map() })
    );
    export type MarkToMarkProp = GeneralLookup.GposMarkToMarkPropT<OtGlyph, OtVar.Value>;
    export type MarkToMark = CaseType<typeof LT.Gpos.MarkToMark, MarkToMarkProp>;
    export const MarkToMark = CaseCreator<typeof LT.Gpos.MarkToMark, MarkToMarkProp>(
        LT.Gpos.MarkToMark,
        () => ({ marks: new Map(), baseMarks: new Map() })
    );

    export type ChainingProp = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, Lookup>;
    export type Chaining = CaseType<typeof LT.Gpos.Chaining, ChainingProp>;
    export const Chaining = CaseCreator<typeof LT.Gpos.Chaining, ChainingProp>(
        LT.Gpos.Chaining,
        () => ({ rules: [] })
    );

    export type Lookup =
        | Single
        | Pair
        | Cursive
        | MarkToBase
        | MarkToMark
        | MarkToLigature
        | Chaining;
    export import LookupType = LT.Gpos;

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
