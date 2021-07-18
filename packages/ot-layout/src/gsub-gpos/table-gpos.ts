import { OtGlyph } from "@ot-builder/ot-glyphs";
import { CaseCreator, CaseType, Data, FallbackPropCreator } from "@ot-builder/prelude";
import * as Primitive from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import * as LayoutCommon from "../common";
import { DicingStore } from "../dicing-store";

import * as GeneralLookup from "./general/lookup";
import { Gpos as LookupType } from "./general/lookup-type";
import * as GsubGpos from "./table-shared";

export * as FeatureParams from "./feature-params";
export { Gpos as LookupType } from "./general/lookup-type";

// GPOS Table
export const Tag = "GPOS";

export class Table implements GsubGpos.TableT<Lookup> {
    constructor(
        public scripts: Map<Primitive.Tag, Script> = new Map(),
        public features: Feature[] = [],
        public lookups: Lookup[] = [],
        public featureVariations: Data.Maybe<FeatureVariation[]> = undefined
    ) {}
}
export type Feature = GsubGpos.FeatureT<Lookup>;
export type Language = GsubGpos.LanguageT<Lookup>;
export type Script = GsubGpos.ScriptT<Lookup>;
export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

export type SingleProp = GeneralLookup.GposSinglePropT<OtGlyph, OtVar.Value>;
export type Single = CaseType<typeof LookupType.Single, SingleProp>;
export const Single = CaseCreator(
    LookupType.Single,
    FallbackPropCreator<SingleProp>(() => ({ adjustments: new Map() }))
);

export type PairProp = GeneralLookup.GposPairPropT<OtGlyph, OtVar.Value>;
export type Pair = CaseType<typeof LookupType.Pair, PairProp>;
export const Pair = CaseCreator(
    LookupType.Pair,
    FallbackPropCreator<PairProp>(() => ({ adjustments: DicingStore.create() }))
);

export type CursiveProp = GeneralLookup.GposCursivePropT<OtGlyph, OtVar.Value>;
export type Cursive = CaseType<typeof LookupType.Cursive, CursiveProp>;
export const Cursive = CaseCreator(
    LookupType.Cursive,
    FallbackPropCreator<CursiveProp>(() => ({ attachments: new Map() }))
);

export type MarkToBaseProp = GeneralLookup.GposMarkToBasePropT<OtGlyph, OtVar.Value>;
export type MarkToBase = CaseType<typeof LookupType.MarkToBase, MarkToBaseProp>;
export const MarkToBase = CaseCreator(
    LookupType.MarkToBase,
    FallbackPropCreator<MarkToBaseProp>(() => ({ marks: new Map(), bases: new Map() }))
);

export type MarkToLigatureProp = GeneralLookup.GposMarkToLigaturePropT<OtGlyph, OtVar.Value>;
export type MarkToLigature = CaseType<typeof LookupType.MarkToLigature, MarkToLigatureProp>;
export const MarkToLigature = CaseCreator(
    LookupType.MarkToLigature,
    FallbackPropCreator<MarkToLigatureProp>(() => ({ marks: new Map(), bases: new Map() }))
);

export type MarkToMarkProp = GeneralLookup.GposMarkToMarkPropT<OtGlyph, OtVar.Value>;
export type MarkToMark = CaseType<typeof LookupType.MarkToMark, MarkToMarkProp>;
export const MarkToMark = CaseCreator(
    LookupType.MarkToMark,
    FallbackPropCreator<MarkToMarkProp>(() => ({ marks: new Map(), baseMarks: new Map() }))
);

export type ChainingProp = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, Lookup>;
export type Chaining = CaseType<typeof LookupType.Chaining, ChainingProp>;
export const Chaining = CaseCreator(
    LookupType.Chaining,
    FallbackPropCreator<ChainingProp>(() => ({ rules: [] }))
);

export type Lookup = Single | Pair | Cursive | MarkToBase | MarkToMark | MarkToLigature | Chaining;

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
