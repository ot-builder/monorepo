import * as Ot from "@ot-builder/ot";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

import { diceZones, SrcZone, Zone, hashZone } from "./zone-dicing";

export interface FeatureConsolidationSource<L> {
    readonly variationDimensions: Data.Order<Ot.Var.Dim>;
    readonly featureVariationCollection: Map<string, Ot.GsubGpos.FeatureVariationT<L>>;

    getFeatureHash(feature: Ot.GsubGpos.FeatureT<L>): string;
    getFeatureVariations(): Iterable<Ot.GsubGpos.FeatureVariationT<L>>;
}

type FeaturePair<L> = [Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>];
export class FeatureConsolidator<L> {
    public hash: string;
    public result: Ot.GsubGpos.FeatureT<L>;
    public resultFeatureVariation: Ot.GsubGpos.FeatureVariationT<L>[];

    constructor(
        private readonly env: FeatureConsolidationSource<L>,
        private readonly tag: Tag,
        private readonly featureList: Ot.GsubGpos.FeatureT<L>[]
    ) {
        this.result = { tag, lookups: [] };
        this.resultFeatureVariation = [];

        let hash = tag;
        for (const feature of featureList) {
            hash += "/" + this.env.getFeatureHash(feature);
        }

        this.hash = hash;
    }

    public resolve() {
        const primeLookupSet = new Set<L>();
        for (const feature of this.featureList) {
            for (const lookup of feature.lookups) primeLookupSet.add(lookup);
        }
        this.result.lookups = Array.from(primeLookupSet);

        if (this.env.variationDimensions.length) this.resolveFeatureVariations();
    }

    private resolveFeatureVariations() {
        const fvs = this.env.getFeatureVariations();
        const srcZones: SrcZone<FeaturePair<L>>[] = [];
        for (const fv of fvs) {
            for (const feature of this.featureList) {
                const substituted = fv.substitutions.get(feature);
                if (substituted)
                    srcZones.push([this.conditionToZone(fv.conditions), [feature, substituted]]);
            }
        }

        if (!srcZones.length) return;

        for (const [zone, tfm] of diceZones(this.env.variationDimensions.length, srcZones)) {
            const hash = hashZone(zone);
            let fv = this.env.featureVariationCollection.get(hash);
            if (!fv) {
                fv = { conditions: this.zoneToConditions(zone), substitutions: new Map() };
                this.env.featureVariationCollection.set(hash, fv);
            }
            const lookupSet = new Set<L>();
            for (const feature of this.featureList) {
                let f = feature;
                for (const t of tfm) if (f === t[0]) f = t[1];
                for (const lookup of f.lookups) lookupSet.add(lookup);
            }

            fv.substitutions.set(this.result, { tag: this.tag, lookups: Array.from(lookupSet) });
        }
    }

    private conditionToZone(fvc: ReadonlyArray<Ot.GsubGpos.FeatureVariationCondition>) {
        const zone: Zone = [];
        for (let d = 0; d < this.env.variationDimensions.length; d++) {
            zone[d] = [-0x10000, 0x10000];
        }
        for (const c of fvc) {
            const d = this.env.variationDimensions.reverse(c.dim);
            zone[d][0] = Math.max(-0x10000, Math.min(0x10000, Math.round(c.min * 0x10000)));
            zone[d][1] = Math.max(-0x10000, Math.min(0x10000, Math.round(c.max * 0x10000)));
        }
        return zone;
    }

    private zoneToConditions(zone: Zone) {
        const cond: Ot.GsubGpos.FeatureVariationCondition[] = [];
        for (let d = 0; d < zone.length; d++) {
            if (zone[d][0] >= -0x10000 && zone[d][1] <= 0x10000)
                cond.push({
                    dim: this.env.variationDimensions.at(d),
                    min: zone[d][0] / 0x10000,
                    max: zone[d][1] / 0x10000
                });
        }
        return cond;
    }
}
