/* eslint-disable @typescript-eslint/no-explicit-any */
import { Sigma } from "@ot-builder/prelude";
import { UInt16, UInt24 } from "@ot-builder/primitive";

export namespace FeatureParams {
    export const TID_StylisticSet = new Sigma.TypeID<StylisticSet>(
        "OTB::FeatureParams::StylisticSet"
    );
    export interface StylisticSet {
        readonly uiNameID: number;
    }

    export const TID_CharacterVariant = new Sigma.TypeID<CharacterVariant>(
        "OTB::FeatureParams::CharacterVariant"
    );
    export interface CharacterVariant {
        readonly featUiLabelNameId: UInt16;
        readonly featUiTooltipTextNameId: UInt16;
        readonly sampleTextNameId: UInt16;
        readonly numNamedParameters: UInt16;
        readonly firstParamUiLabelNameId: UInt16;
        readonly characters: ReadonlyArray<UInt24>;
    }

    const _tagToTypeIDMap: { [tag: string]: undefined | Sigma.TypeID<any> } = {};
    for (let id = 1; id <= 99; id++) {
        let idRep = "" + id;
        if (idRep.length < 2) idRep = "0" + idRep;
        _tagToTypeIDMap["ss" + idRep] = TID_StylisticSet;
        _tagToTypeIDMap["cv" + idRep] = TID_CharacterVariant;
    }

    export const tagToTypeIDMap: {
        readonly [tag: string]: undefined | Sigma.TypeID<any>;
    } = _tagToTypeIDMap;
}
