import { OtGlyph } from "@ot-builder/ot-glyphs";
import { CaseCreator, CaseType, Data, FallbackPropCreator } from "@ot-builder/prelude";
import * as Primitive from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import * as LayoutCommon from "../common";

import * as GeneralLookup from "./general/lookup";
import { Gsub as LookupType } from "./general/lookup-type";
import * as GsubGpos from "./table-shared";

export * as FeatureParams from "./feature-params";
export { Gsub as LookupType } from "./general/lookup-type";

// GSUB table definitions
export const Tag = "GSUB";

export class Table implements GsubGpos.TableT<Lookup> {
    constructor(
        public scripts: Map<Primitive.Tag, Script> = new Map(),
        public features: Feature[] = [],
        public lookups: Lookup[] = [],
        public featureVariations: Data.Maybe<FeatureVariation[]> = undefined
    ) {}
}

// export type Table = GsubGpos.TableT<Lookup>;
// export const Table = CreateTable<Lookup>();
export type Feature = GsubGpos.FeatureT<Lookup>;
export type Language = GsubGpos.LanguageT<Lookup>;
export type Script = GsubGpos.ScriptT<Lookup>;
export type AxisRangeCondition = GsubGpos.AxisRangeCondition;
export type FeatureVariationCondition = GsubGpos.AxisRangeCondition;
export type FeatureVariation = GsubGpos.FeatureVariationT<Lookup>;

export type SingleProp = GeneralLookup.GsubSinglePropT<OtGlyph, OtVar.Value>;
export type Single = CaseType<typeof LookupType.Single, SingleProp>;
export const Single = CaseCreator(
    LookupType.Single,
    FallbackPropCreator<SingleProp>(() => ({ mapping: new Map() }))
);

export type MultipleAlternateProp = GeneralLookup.GsubMultipleAlternatePropT<OtGlyph, OtVar.Value>;
export type Multiple = CaseType<typeof LookupType.Multi, MultipleAlternateProp>;
export const Multiple = CaseCreator(
    LookupType.Multi,
    FallbackPropCreator<MultipleAlternateProp>(() => ({ mapping: new Map() }))
);
export type Alternate = CaseType<typeof LookupType.Alternate, MultipleAlternateProp>;
export const Alternate = CaseCreator(
    LookupType.Alternate,
    FallbackPropCreator<MultipleAlternateProp>(() => ({ mapping: new Map() }))
);

export type LigatureProp = GeneralLookup.GsubLigaturePropT<OtGlyph, OtVar.Value>;
export type Ligature = CaseType<typeof LookupType.Ligature, LigatureProp>;
export const Ligature = CaseCreator(
    LookupType.Ligature,
    FallbackPropCreator<LigatureProp>(() => ({ mapping: [] }))
);

export type ChainingProp = GeneralLookup.ForwardChainingPropT<OtGlyph, OtVar.Value, Lookup>;
export type Chaining = CaseType<typeof LookupType.Chaining, ChainingProp>;
export const Chaining = CaseCreator(
    LookupType.Chaining,
    FallbackPropCreator<ChainingProp>(() => ({ rules: [] }))
);

export type ReverseSubProp = GeneralLookup.GsubReverseSingleSubPropT<OtGlyph, OtVar.Value>;
export type ReverseSub = CaseType<typeof LookupType.Reverse, ReverseSubProp>;
export const ReverseSub = CaseCreator(
    LookupType.Reverse,
    FallbackPropCreator<ReverseSubProp>(() => ({ rules: [] }))
);

export type Lookup = Single | Multiple | Alternate | Ligature | Chaining | ReverseSub;

// Lookup-internal data types
export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

export type LigatureEntry = GeneralLookup.GsubLigatureLookupEntryT<OtGlyph>;

export type ChainingApplication<E> = GsubGpos.ChainingApplication<E>;
export type ChainingRule<E> = GsubGpos.ChainingRule<E>;
export type ChainingClassRule = GsubGpos.ChainingClassRule<Lookup>;

export type ReverseRule = GeneralLookup.GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;
