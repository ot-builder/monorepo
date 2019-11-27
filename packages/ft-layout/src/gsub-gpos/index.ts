import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";
import { ChainingApplicationT, ChainingRuleT, ForwardChainingLookupT } from "../lookup/chaining";
import { GposCursiveLookupT } from "../lookup/gpos-cursive";
import {
    GposBaseRecordT,
    GposLigatureRecordT,
    GposMarkRecordT,
    GposMarkToBaseLookupT,
    GposMarkToLigatureLookupT,
    GposMarkToMarkLookupT
} from "../lookup/gpos-mark";
import { GposPairLookupT } from "../lookup/gpos-pair";
import { GposSingleLookupT } from "../lookup/gpos-single";
import { GsubLigatureLookupT } from "../lookup/gsub-ligature";
import { GsubAlternateLookupT, GsubMultipleLookupT } from "../lookup/gsub-multiple";
import { GsubReverseRuleT, GsubReverseSingleSubT, GsubReverseSubstT } from "../lookup/gsub-reverse";
import { GsubSingleLookupT } from "../lookup/gsub-single";

import { GeneralGsubGpos } from "./general";

export namespace GsubGpos {
    export import General = GeneralGsubGpos;

    export type Table = GeneralGsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value, Lookup>;
    export type Lookup = GeneralGsubGpos.LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<Lookup>;
    export type Language = GeneralGsubGpos.LanguageT<Lookup>;
    export type Script = GeneralGsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<OtVar.Axis, Lookup>;

    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type ChainingApplication = ChainingApplicationT<Lookup>;
    export type ChainingRule = ChainingRuleT<Set<OtGlyph>, Lookup>;
    export type ChainingClassRule = ChainingRuleT<number, Lookup>;
    export type ChainingLookup = ForwardChainingLookupT<OtGlyph, OtVar.Value, GsubGpos.Lookup>;
}

export namespace Gsub {
    export const Tag = "GSUB";

    export class Table extends GeneralGsubGpos.TableImpl<OtVar.Axis, OtGlyph, OtVar.Value> {}
    export type Lookup = GeneralGsubGpos.LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<Lookup>;
    export type Language = GeneralGsubGpos.LanguageT<Lookup>;
    export type Script = GeneralGsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<OtVar.Axis, Lookup>;

    // Lookup classes
    export class Single extends GsubSingleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Multiple extends GsubMultipleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Alternate extends GsubAlternateLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Ligature extends GsubLigatureLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Chaining extends ForwardChainingLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class ReverseSub extends GsubReverseSingleSubT<OtGlyph, OtVar.Value, Lookup> {}

    // Lookup-internal data types
    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type ChainingApplication = GsubGpos.ChainingApplication;
    export type ChainingRule = GsubGpos.ChainingRule;
    export type ChainingClassRule = GsubGpos.ChainingClassRule;

    export type ReverseRuleSubst = GsubReverseSubstT<OtGlyph>;
    export type ReverseRule = GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;
}

export namespace Gpos {
    export const Tag = "GPOS";

    export class Table extends GeneralGsubGpos.TableImpl<OtVar.Axis, OtGlyph, OtVar.Value> {}
    export type Lookup = GeneralGsubGpos.LookupT<OtGlyph, OtVar.Value>;
    export type Feature = GeneralGsubGpos.FeatureT<Lookup>;
    export type Language = GeneralGsubGpos.LanguageT<Lookup>;
    export type Script = GeneralGsubGpos.ScriptT<Lookup>;
    export type AxisRangeCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GeneralGsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GeneralGsubGpos.FeatureVariationT<OtVar.Axis, Lookup>;

    // Lookup classes
    export class Single extends GposSingleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Pair extends GposPairLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Cursive extends GposCursiveLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToBase extends GposMarkToBaseLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToLigature extends GposMarkToLigatureLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToMark extends GposMarkToMarkLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Chaining extends ForwardChainingLookupT<OtGlyph, OtVar.Value, Lookup> {}

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
