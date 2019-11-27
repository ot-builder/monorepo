import { BinaryView, Frag } from "@ot-builder/bin-util";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Caster, Data } from "@ot-builder/prelude";
import { Tag, UInt16 } from "@ot-builder/primitive";

import { FeatureParams } from "./feature-param";

export const FeatureTable = {
    read(view: BinaryView, lOrd: Data.Order<GsubGpos.Lookup>, tag: Tag): GsubGpos.Feature {
        const vFeatureParams = view.ptr16Nullable();
        let featureParams: Data.Maybe<Caster.Sigma> = undefined;
        if (vFeatureParams) featureParams = vFeatureParams.next(FeatureParams, tag);
        const lookups = view.array(view.uint16(), UInt16).map(x => lOrd.at(x));
        return { tag, lookups, params: featureParams };
    },
    write(frag: Frag, feat: GsubGpos.Feature, lOrd: Data.Order<GsubGpos.Lookup>) {
        frag.ptr16(FeatureParams.writeOpt(feat.params, feat.tag));
        frag.uint16(feat.lookups.length);
        for (const lookup of feat.lookups) frag.uint16(lOrd.reverse(lookup));
    }
};

export const FeatureList = {
    read(view: BinaryView, lOrd: Data.Order<GsubGpos.Lookup>) {
        const featureCount = view.uint16();
        const features: GsubGpos.Feature[] = [];
        for (let fid = 0; fid < featureCount; fid++) {
            const tag = view.next(Tag);
            features.push(view.ptr16().next(FeatureTable, lOrd, tag));
        }
        return features;
    },
    write(
        frag: Frag,
        featureList: ReadonlyArray<GsubGpos.Feature>,
        lOrd: Data.Order<GsubGpos.Lookup>
    ) {
        frag.uint16(featureList.length);
        for (const feature of featureList) {
            frag.push(Tag, feature.tag);
            frag.ptr16New().push(FeatureTable, feature, lOrd);
        }
    }
};
