import { Sigma } from "@ot-builder/prelude";

export namespace FeatureParams {
    export interface StylisticSet {
        readonly uiNameID: number;
    }
    export const TID_StylisticSet = new Sigma.TypeID<StylisticSet>(
        "OTB::FeatureParams::StylisticSet"
    );

    const _tagToTypeIDMap: { [tag: string]: undefined | Sigma.TypeID<any> } = {};

    // ss01 -- ss20
    _tagToTypeIDMap["ss01"] = TID_StylisticSet;
    _tagToTypeIDMap["ss02"] = TID_StylisticSet;
    _tagToTypeIDMap["ss03"] = TID_StylisticSet;
    _tagToTypeIDMap["ss04"] = TID_StylisticSet;
    _tagToTypeIDMap["ss05"] = TID_StylisticSet;
    _tagToTypeIDMap["ss06"] = TID_StylisticSet;
    _tagToTypeIDMap["ss07"] = TID_StylisticSet;
    _tagToTypeIDMap["ss08"] = TID_StylisticSet;
    _tagToTypeIDMap["ss09"] = TID_StylisticSet;
    _tagToTypeIDMap["ss10"] = TID_StylisticSet;
    _tagToTypeIDMap["ss11"] = TID_StylisticSet;
    _tagToTypeIDMap["ss12"] = TID_StylisticSet;
    _tagToTypeIDMap["ss13"] = TID_StylisticSet;
    _tagToTypeIDMap["ss14"] = TID_StylisticSet;
    _tagToTypeIDMap["ss15"] = TID_StylisticSet;
    _tagToTypeIDMap["ss16"] = TID_StylisticSet;
    _tagToTypeIDMap["ss17"] = TID_StylisticSet;
    _tagToTypeIDMap["ss18"] = TID_StylisticSet;
    _tagToTypeIDMap["ss19"] = TID_StylisticSet;
    _tagToTypeIDMap["ss20"] = TID_StylisticSet;

    export const tagToTypeIDMap: {
        readonly [tag: string]: undefined | Sigma.TypeID<any>;
    } = _tagToTypeIDMap;
}
