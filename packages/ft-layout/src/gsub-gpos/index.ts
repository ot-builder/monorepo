import { OtGlyph } from "@ot-builder/ft-glyphs";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";

import { CreateTable, Creator } from "./factories";
import * as FeatureParamLib from "./feature-params";
import * as GeneralLookup from "./general/lookup";
import * as GeneralGsubGpos from "./general/shared";
import * as LibChaining from "./lookup-impl/chaining";
import * as LibGposCursive from "./lookup-impl/gpos-cursive";
import * as LibGposMark from "./lookup-impl/gpos-mark";
import * as LibGposPair from "./lookup-impl/gpos-pair";
import * as LibGposSingle from "./lookup-impl/gpos-single";
import * as LibGsubLigature from "./lookup-impl/gsub-ligature";
import * as LibGsubMultiAlt from "./lookup-impl/gsub-multiple";
import * as LibGsubReverse from "./lookup-impl/gsub-reverse";
import * as LibGsubSingle from "./lookup-impl/gsub-single";

export namespace GsubGpos {
    export import General = GeneralGsubGpos;
    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type TableT<L> = GeneralGsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value, L>;
    export type FeatureT<L> = GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value, L>;
    export type LanguageT<L> = GeneralGsubGpos.LanguageT<OtGlyph, OtVar.Value, L>;
    export type ScriptT<L> = GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value, L>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationT<L> = GeneralGsubGpos.FeatureVariationT<
        OtVar.Axis,
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
}

export namespace Gsub {
    export const Tag = "GSUB";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type Table = GsubGpos.TableT<Lookup>;
    export const Table = CreateTable<Lookup>();
    export type Lookup = GeneralLookup.GsubLookupT<OtGlyph, OtVar.Value>;
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

    // Lookup classes
    export type Single = Lookup & SingleProp;
    export const Single = Creator<Single>(LibGsubSingle.GsubSingleLookupT);
    export type Multiple = Lookup & MultipleAlternateProp;
    export const Multiple = Creator<Multiple>(LibGsubMultiAlt.GsubMultipleLookupT);
    export type Alternate = Lookup & MultipleAlternateProp;
    export const Alternate = Creator<Alternate>(LibGsubMultiAlt.GsubAlternateLookupT);
    export type Ligature = Lookup & LigatureProp;
    export const Ligature = Creator<Ligature>(LibGsubLigature.GsubLigatureLookupT);
    export type Chaining = Lookup & ChainingProp<Lookup>;
    export const Chaining = Creator<Chaining>(LibChaining.GsubChainingLookupT);
    export type ReverseSub = Lookup & ReverseSubProp;
    export const ReverseSub = Creator<ReverseSub>(LibGsubReverse.GsubReverseSingleSubLookupT);

    // Data props
    export type SingleProp = GeneralLookup.GsubSinglePropT<OtGlyph, OtVar.Value>;
    export type MultipleAlternateProp = GeneralLookup.GsubMultipleAlternatePropT<
        OtGlyph,
        OtVar.Value
    >;
    export type LigatureProp = GeneralLookup.GsubLigaturePropT<OtGlyph, OtVar.Value>;
    export type ChainingProp<E> = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, E>;
    export type ReverseSubProp = GeneralLookup.GsubReverseSingleSubPropT<OtGlyph, OtVar.Value>;

    // Lookup-internal data types
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type LigatureEntry = GeneralLookup.GsubLigatureLookupEntryT<OtGlyph>;

    export type ChainingApplication<E> = GsubGpos.ChainingApplication<E>;
    export type ChainingRule<E> = GsubGpos.ChainingRule<E>;
    export type ChainingClassRule = GsubGpos.ChainingClassRule<Lookup>;

    export type ReverseRule = GeneralLookup.GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;

    export type LookupAlg<E> = GeneralLookup.GsubLookupAlgT<OtGlyph, OtVar.Value, E>;
}

export namespace Gpos {
    export const Tag = "GPOS";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type Table = GsubGpos.TableT<Lookup>;
    export const Table = CreateTable<Lookup>();
    export type Lookup = GeneralLookup.GposLookupT<OtGlyph, OtVar.Value>;
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
    export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

    // Lookup classes
    export type Single = Lookup & SingleProp;
    export const Single = Creator<Single>(LibGposSingle.GposSingleLookupT);
    export type Pair = Lookup & PairProp;
    export const Pair = Creator<Pair>(LibGposPair.GposPairLookupT);
    export type Cursive = Lookup & CursiveProp;
    export const Cursive = Creator<Cursive>(LibGposCursive.GposCursiveLookupT);
    export type MarkToBase = Lookup & MarkToBaseProp;
    export const MarkToBase = Creator<MarkToBase>(LibGposMark.GposMarkToBaseLookupT);
    export type MarkToLigature = Lookup & MarkToLigatureProp;
    export const MarkToLigature = Creator<MarkToLigature>(LibGposMark.GposMarkToLigatureLookupT);
    export type MarkToMark = Lookup & MarkToMarkProp;
    export const MarkToMark = Creator<MarkToMark>(LibGposMark.GposMarkToMarkLookupT);
    export type Chaining = Lookup & ChainingProp<Lookup>;
    export const Chaining = Creator<Chaining>(LibChaining.GposChainingLookupT);

    export type SingleProp = GeneralLookup.GposSinglePropT<OtGlyph, OtVar.Value>;
    export type PairProp = GeneralLookup.GposPairPropT<OtGlyph, OtVar.Value>;
    export type CursiveProp = GeneralLookup.GposCursivePropT<OtGlyph, OtVar.Value>;
    export type MarkToBaseProp = GeneralLookup.GposMarkToBasePropT<OtGlyph, OtVar.Value>;
    export type MarkToLigatureProp = GeneralLookup.GposMarkToLigaturePropT<OtGlyph, OtVar.Value>;
    export type MarkToMarkProp = GeneralLookup.GposMarkToMarkPropT<OtGlyph, OtVar.Value>;
    export type ChainingProp<E> = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, E>;

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

    export type LookupAlg<E> = GeneralLookup.GposLookupAlgT<OtGlyph, OtVar.Value, E>;
}
