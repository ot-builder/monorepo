import { ImpLib } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

import { FeatureConsolidationSource, FeatureConsolidator } from "./consolidate/feature";
import { mergeMapAlt } from "./utils";

export class GsubGposMerger<L> implements FeatureConsolidationSource<L> {
    constructor(
        readonly variationDimensions: Data.Order<Ot.Var.Dim>,
        readonly preferred: Ot.GsubGpos.TableT<L>,
        readonly less: Ot.GsubGpos.TableT<L>
    ) {
        this.fordPreferred = ImpLib.Order.fromList("Features", preferred.features);
        this.fordLess = ImpLib.Order.fromList("Features", less.features);
    }

    resolve(): Ot.GsubGpos.TableT<L> {
        const lookups = this.getLookups();
        const scripts = this.mergeScriptList();
        for (const plan of this.featureMergingPlans.values()) plan.resolve();
        const features = Array.from(this.featureMergingPlans.values()).map(p => p.result);
        const featureVariations = Array.from(this.featureVariationCollection.values());

        return { scripts, features, lookups, featureVariations };
    }

    private getLookups() {
        return [...this.preferred.lookups, ...this.less.lookups];
    }

    private mergeScriptList() {
        return mergeMapAlt(this.preferred.scripts, this.less.scripts, this.mergeScript.bind(this));
    }
    private mergeScript(
        preferred: Data.Maybe<Ot.GsubGpos.ScriptT<L>>,
        less: Data.Maybe<Ot.GsubGpos.ScriptT<L>>
    ) {
        if (!preferred) preferred = { defaultLanguage: null, languages: new Map() };
        if (!less) less = { defaultLanguage: null, languages: new Map() };
        return {
            defaultLanguage: this.mergeLanguage(preferred.defaultLanguage, less.defaultLanguage),
            languages: mergeMapAlt(
                preferred.languages,
                less.languages,
                this.mergeLanguage.bind(this)
            )
        };
    }

    private mergeLanguage(
        preferred: Data.Maybe<Ot.GsubGpos.LanguageT<L>>,
        less: Data.Maybe<Ot.GsubGpos.LanguageT<L>>
    ): Ot.GsubGpos.LanguageT<L> {
        if (!preferred) preferred = { requiredFeature: null, features: [] };
        if (!less) less = { requiredFeature: null, features: [] };
        return {
            requiredFeature: this.mergeRequiredFeature(
                preferred.requiredFeature,
                less.requiredFeature
            ),
            features: this.combineFeatureList([...preferred.features, ...less.features])
        };
    }

    private featureMergingPlans: Map<string, FeatureConsolidator<L>> = new Map();

    private mergeRequiredFeature(
        preferred: Data.Maybe<Ot.GsubGpos.FeatureT<L>>,
        less: Data.Maybe<Ot.GsubGpos.FeatureT<L>>
    ) {
        if (!preferred) {
            if (less) return this.pushMergingPlans(less.tag, [less]);
            else return null;
        }
        if (!less) return this.pushMergingPlans(preferred.tag, [preferred]);

        if (preferred.tag !== less.tag) {
            throw new Error(
                `Required feature cannot be merged: tag ${preferred.tag} <> ${less.tag}.`
            );
        }

        return this.pushMergingPlans(preferred.tag, [preferred, less]);
    }

    private combineFeatureList(features: Iterable<Ot.GsubGpos.FeatureT<L>>) {
        const tagToFeatureListMap = new Map<Tag, Ot.GsubGpos.FeatureT<L>[]>();
        for (const feature of [...features]) {
            let tfl = tagToFeatureListMap.get(feature.tag);
            if (!tfl) {
                tfl = [];
                tagToFeatureListMap.set(feature.tag, tfl);
            }
            tfl.push(feature);
        }

        const results: Ot.GsubGpos.FeatureT<L>[] = [];
        for (const [tag, tfl] of tagToFeatureListMap) {
            const plan = this.pushMergingPlans(tag, tfl);
            results.push(plan);
        }
        return results;
    }

    private pushMergingPlans(tag: Tag, featureList: Ot.GsubGpos.FeatureT<L>[]) {
        const plan = new FeatureConsolidator<L>(this, tag, featureList);
        const existing = this.featureMergingPlans.get(plan.hash);
        if (!existing) {
            this.featureMergingPlans.set(plan.hash, plan);
            return plan.result;
        } else {
            return existing.result;
        }
    }

    private fordPreferred: Data.Order<Ot.GsubGpos.FeatureT<L>>;
    private fordLess: Data.Order<Ot.GsubGpos.FeatureT<L>>;
    featureVariationCollection: Map<string, Ot.GsubGpos.FeatureVariationT<L>> = new Map();

    getFeatureHash(feature: Ot.GsubGpos.FeatureT<L>) {
        const fidPreferred = this.fordPreferred.tryReverseFallback(feature, -1);
        const fidLess = this.fordLess.tryReverseFallback(feature, -1);
        return `${fidPreferred};${fidLess}`;
    }

    *getFeatureVariations() {
        yield* this.preferred.featureVariations || [];
        yield* this.less.featureVariations || [];
    }
}
