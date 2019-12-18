import { Caster, Data } from "@ot-builder/prelude";
import { F2D14, Tag } from "@ot-builder/primitive";

import { LookupT } from "./lookup";

export interface FeatureT<G, X> {
    tag: Tag;
    lookups: Array<LookupT<G, X>>;
    params?: Data.Maybe<Caster.Sigma>;
}

export interface LanguageT<G, X> {
    requiredFeature: Data.Maybe<FeatureT<G, X>>;
    features: Array<FeatureT<G, X>>;
}

export interface ScriptT<G, X> {
    defaultLanguage: Data.Maybe<LanguageT<G, X>>;
    languages: Map<Tag, LanguageT<G, X>>;
}

export interface AxisRangeConditionT<A> {
    axis: A;
    min: F2D14;
    max: F2D14;
}
export type FeatureVariationConditionT<A> = AxisRangeConditionT<A>;
export interface FeatureVariationT<A, G, X> {
    conditions: Array<FeatureVariationConditionT<A>>;
    substitutions: Map<FeatureT<G, X>, FeatureT<G, X>>;
}

export interface TableT<A, G, X> {
    scripts: Map<Tag, ScriptT<G, X>>;
    features: Array<FeatureT<G, X>>;
    lookups: LookupT<G, X>[];
    featureVariations: Data.Maybe<Array<FeatureVariationT<A, G, X>>>;
}
