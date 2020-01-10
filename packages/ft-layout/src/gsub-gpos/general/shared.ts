import { Data, Sigma } from "@ot-builder/prelude";
import { F2D14, Tag } from "@ot-builder/primitive";

export interface FeatureT<G, X, L> {
    tag: Tag;
    lookups: Array<L>;
    params?: Data.Maybe<Sigma.DependentPair>;
}

export interface LanguageT<G, X, L> {
    requiredFeature: Data.Maybe<FeatureT<G, X, L>>;
    features: Array<FeatureT<G, X, L>>;
}

export interface ScriptT<G, X, L> {
    defaultLanguage: Data.Maybe<LanguageT<G, X, L>>;
    languages: Map<Tag, LanguageT<G, X, L>>;
}

export interface AxisRangeConditionT<A> {
    dim: A;
    min: F2D14;
    max: F2D14;
}
export type FeatureVariationConditionT<A> = AxisRangeConditionT<A>;
export interface FeatureVariationT<A, G, X, L> {
    conditions: Array<FeatureVariationConditionT<A>>;
    substitutions: Map<FeatureT<G, X, L>, FeatureT<G, X, L>>;
}

export interface TableT<A, G, X, L> {
    scripts: Map<Tag, ScriptT<G, X, L>>;
    features: Array<FeatureT<G, X, L>>;
    lookups: L[];
    featureVariations: Data.Maybe<Array<FeatureVariationT<A, G, X, L>>>;
}
