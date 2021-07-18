import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtVar } from "@ot-builder/variance";

import * as LayoutCommon from "../common";

import * as GeneralLookup from "./general/lookup";
import * as GeneralGsubGpos from "./general/shared";

export * as FeatureParams from "./feature-params";
export * as LookupType from "./general/lookup-type";
export * as GeneralGsubGpos from "./general/shared";

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
