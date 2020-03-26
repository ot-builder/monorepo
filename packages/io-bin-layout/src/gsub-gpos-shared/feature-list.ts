import { BinaryView, Frag } from "@ot-builder/bin-util";
import { GsubGpos } from "@ot-builder/ot-layout";
import { Data, Sigma } from "@ot-builder/prelude";
import { Tag, UInt16 } from "@ot-builder/primitive";

import { FeatureParams } from "./feature-param";

export class CFeatureTable<L> {
    public read(view: BinaryView, lOrd: Data.Order<L>, tag: Tag): GsubGpos.FeatureT<L> {
        const vFeatureParams = view.ptr16Nullable();
        let featureParams: Data.Maybe<Sigma.DependentPair> = undefined;
        if (vFeatureParams) featureParams = vFeatureParams.next(FeatureParams, tag);
        const lookups = view.array(view.uint16(), UInt16).map(x => lOrd.at(x));
        return { tag, lookups, params: featureParams };
    }
    public write(frag: Frag, feat: GsubGpos.FeatureT<L>, lOrd: Data.Order<L>) {
        frag.ptr16(FeatureParams.writeOpt(feat.params, feat.tag));
        frag.uint16(feat.lookups.length);
        for (const lookup of feat.lookups) frag.uint16(lOrd.reverse(lookup));
    }
}

export class CFeatureList<L> {
    public read(view: BinaryView, lOrd: Data.Order<L>) {
        const featureCount = view.uint16();
        const features: GsubGpos.FeatureT<L>[] = [];
        const readFeatureTable = new CFeatureTable<L>();
        for (let fid = 0; fid < featureCount; fid++) {
            const tag = view.next(Tag);
            features.push(view.ptr16().next(readFeatureTable, lOrd, tag));
        }
        return features;
    }
    public write(
        frag: Frag,
        featureList: ReadonlyArray<GsubGpos.FeatureT<L>>,
        lOrd: Data.Order<L>
    ) {
        frag.uint16(featureList.length);
        const writer = new CFeatureTable<L>();
        for (const feature of featureList) {
            frag.push(Tag, feature.tag);
            frag.ptr16New().push(writer, feature, lOrd);
        }
    }
}
