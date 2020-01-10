import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data, Sigma } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

export const FeatureParams = {
    read(view: BinaryView, tag: Tag) {
        if (
            GsubGpos.FeatureParams.tagToTypeIDMap[tag] === GsubGpos.FeatureParams.TID_StylisticSet
        ) {
            return Sigma.DependentPair.create(
                GsubGpos.FeatureParams.TID_StylisticSet,
                view.next(FeatureParamStylisticSet)
            );
        }
        return undefined;
    },
    writeOpt(fp: Data.Maybe<Sigma.DependentPair>, tag: Tag) {
        if (!fp) return null;
        const tagDrivenTypeID = GsubGpos.FeatureParams.tagToTypeIDMap[tag];
        if (!tagDrivenTypeID) return null;
        const fpTag = fp.cast(tagDrivenTypeID);
        if (!fpTag) return null;
        const fpSS = fp.cast(GsubGpos.FeatureParams.TID_StylisticSet);
        if (fpSS) return Frag.from(FeatureParamStylisticSet, fpSS);
        return null;
    }
};

const FeatureParamStylisticSet = {
    read(view: BinaryView): GsubGpos.FeatureParams.StylisticSet {
        const version = view.uint16();
        Assert.VersionSupported("FeatureParams::StylisticSet", version, 0);
        const uiNameID = view.uint16();
        return { uiNameID };
    },
    write(frag: Frag, fp: GsubGpos.FeatureParams.StylisticSet) {
        frag.uint16(0);
        frag.uint16(fp.uiNameID);
    }
};
