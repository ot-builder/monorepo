import { OtGlyph } from "@ot-builder/ft-glyphs";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";
import {
    ForwardChainingLookupBaseT,
    GposChainingLookupT,
    GsubChainingLookupT
} from "../lookup/chaining";
import {
    ChainingApplicationT,
    ChainingRuleT,
    ForwardChainingPropT,
    GposBaseRecordT,
    GposCursivePropT,
    GposLigatureRecordT,
    GposMarkRecordT,
    GposMarkToBasePropT,
    GposMarkToLigaturePropT,
    GposMarkToMarkPropT,
    GposPairPropT,
    GposSinglePropT,
    GsubLigatureLookupEntryT,
    GsubLigaturePropT,
    GsubMultipleAlternatePropT,
    GsubReverseRuleT,
    GsubReverseSingleSubPropT,
    GsubReverseSubstT,
    GsubSinglePropT,
    LookupAlgT,
    LookupPropT,
    LookupT
} from "../lookup/general";
import { GposCursiveLookupT } from "../lookup/gpos-cursive";
import {
    GposMarkToBaseLookupT,
    GposMarkToLigatureLookupT,
    GposMarkToMarkLookupT
} from "../lookup/gpos-mark";
import { GposPairLookupT } from "../lookup/gpos-pair";
import { GposSingleLookupT } from "../lookup/gpos-single";
import { GsubLigatureLookupT } from "../lookup/gsub-ligature";
import { GsubAlternateLookupT, GsubMultipleLookupT } from "../lookup/gsub-multiple";
import { GsubReverseSingleSubLookupT } from "../lookup/gsub-reverse";
import { GsubSingleLookupT } from "../lookup/gsub-single";

import * as FeatureParamLib from "./feature-params";
import { GeneralGsubGpos } from "./general";

export namespace GsubGpos {
    export import General = GeneralGsubGpos;
    export import FeatureParams = FeatureParamLib.FeatureParams;

    export type Table = GeneralGsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value>;
    export type Lookup = LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value>;
    export type Language = GeneralGsubGpos.LanguageT<OtGlyph, OtVar.Value>;
    export type Script = GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<
        OtVar.Axis,
        OtGlyph,
        OtVar.Value
    >;

    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type ChainingApplication = ChainingApplicationT<Lookup>;
    export type ChainingRule = ChainingRuleT<Set<OtGlyph>, Lookup>;
    export type ChainingClassRule = ChainingRuleT<number, Lookup>;
    export type ChainingLookup = ForwardChainingLookupBaseT<OtGlyph, OtVar.Value>;
    export type ChainingProp<E> = ForwardChainingPropT<OtGlyph, OtVar.Value, E>;

    export type LookupProp = LookupPropT<OtGlyph>;
    export type LookupAlg<E> = LookupAlgT<OtGlyph, OtVar.Value, E>;
}

export namespace Gsub {
    export const Tag = "GSUB";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export class Table extends GeneralGsubGpos.TableImpl<OtVar.Axis, OtGlyph, OtVar.Value> {}
    export type Lookup = LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value>;
    export type Language = GeneralGsubGpos.LanguageT<OtGlyph, OtVar.Value>;
    export type Script = GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<
        OtVar.Axis,
        OtGlyph,
        OtVar.Value
    >;

    // Lookup classes
    export class Single extends GsubSingleLookupT<OtGlyph, OtVar.Value> {}
    export class Multiple extends GsubMultipleLookupT<OtGlyph, OtVar.Value> {}
    export class Alternate extends GsubAlternateLookupT<OtGlyph, OtVar.Value> {}
    export class Ligature extends GsubLigatureLookupT<OtGlyph, OtVar.Value> {}
    export class Chaining extends GsubChainingLookupT<OtGlyph, OtVar.Value> {}
    export class ReverseSub extends GsubReverseSingleSubLookupT<OtGlyph, OtVar.Value> {}

    // Data props
    export type SingleProp = GsubSinglePropT<OtGlyph, OtVar.Value>;
    export type MultipleAlternateProp = GsubMultipleAlternatePropT<OtGlyph, OtVar.Value>;
    export type LigatureProp = GsubLigaturePropT<OtGlyph, OtVar.Value>;
    export type ChainingProp<E> = ForwardChainingPropT<OtGlyph, OtVar.Value, E>;
    export type ReverseSubProp = GsubReverseSingleSubPropT<OtGlyph, OtVar.Value>;

    // Lookup-internal data types
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type LigatureEntry = GsubLigatureLookupEntryT<OtGlyph>;

    export type ChainingApplication = GsubGpos.ChainingApplication;
    export type ChainingRule = GsubGpos.ChainingRule;
    export type ChainingClassRule = GsubGpos.ChainingClassRule;

    export type ReverseRuleSubst = GsubReverseSubstT<OtGlyph>;
    export type ReverseRule = GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;
}

export namespace Gpos {
    export const Tag = "GPOS";

    export import FeatureParams = FeatureParamLib.FeatureParams;

    export class Table extends GeneralGsubGpos.TableImpl<OtVar.Axis, OtGlyph, OtVar.Value> {}
    export type Lookup = LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value>;
    export type Language = GeneralGsubGpos.LanguageT<OtGlyph, OtVar.Value>;
    export type Script = GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<
        OtVar.Axis,
        OtGlyph,
        OtVar.Value
    >;

    // Lookup classes
    export class Single extends GposSingleLookupT<OtGlyph, OtVar.Value> {}
    export class Pair extends GposPairLookupT<OtGlyph, OtVar.Value> {}
    export class Cursive extends GposCursiveLookupT<OtGlyph, OtVar.Value> {}
    export class MarkToBase extends GposMarkToBaseLookupT<OtGlyph, OtVar.Value> {}
    export class MarkToLigature extends GposMarkToLigatureLookupT<OtGlyph, OtVar.Value> {}
    export class MarkToMark extends GposMarkToMarkLookupT<OtGlyph, OtVar.Value> {}
    export class Chaining extends GposChainingLookupT<OtGlyph, OtVar.Value> {}

    export type SingleProp = GposSinglePropT<OtGlyph, OtVar.Value>;
    export type PairProp = GposPairPropT<OtGlyph, OtVar.Value>;
    export type CursiveProp = GposCursivePropT<OtGlyph, OtVar.Value>;
    export type MarkToBaseProp = GposMarkToBasePropT<OtGlyph, OtVar.Value>;
    export type MarkToLigatureProp = GposMarkToLigaturePropT<OtGlyph, OtVar.Value>;
    export type MarkToMarkProp = GposMarkToMarkPropT<OtGlyph, OtVar.Value>;
    export type ChainingProp<E> = ForwardChainingPropT<OtGlyph, OtVar.Value, E>;

    // Lookup-internal data type aliases
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type Adjustment = LayoutCommon.Adjust.T<OtVar.Value>;
    export type AdjustmentPair = LayoutCommon.Adjust.PairT<OtVar.Value>;
    export type Anchor = LayoutCommon.Anchor.T<OtVar.Value>;
    export type CursiveAnchorPair = LayoutCommon.CursiveAnchorPair.T<OtVar.Value>;

    export type MarkRecord = GposMarkRecordT<OtVar.Value>;
    export type BaseRecord = GposBaseRecordT<OtVar.Value>;
    export type LigatureRecord = GposLigatureRecordT<OtVar.Value>;

    export type ChainingApplication = GsubGpos.ChainingApplication;
    export type ChainingRule = GsubGpos.ChainingRule;
    export type ChainingClassRule = GsubGpos.ChainingClassRule;

    // Zeroes
    export const ZeroAdjustment: Adjustment = { dX: 0, dY: 0, dWidth: 0, dHeight: 0 };
    export const ZeroAdjustmentPair: AdjustmentPair = [ZeroAdjustment, ZeroAdjustment];
}
