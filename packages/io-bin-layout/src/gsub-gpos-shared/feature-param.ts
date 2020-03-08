import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data, Sigma } from "@ot-builder/prelude";
import { Tag, UInt24 } from "@ot-builder/primitive";

export const FeatureParams = {
    read(view: BinaryView, tag: Tag) {
        for (const handler of FeatureParamHandlers) {
            const result = handler.tryRead(tag, view);
            if (result) return result;
        }
        return undefined;
    },
    writeOpt(fp: Data.Maybe<Sigma.DependentPair>, tag: Tag) {
        if (!fp) return null;
        const tagDrivenTypeID = GsubGpos.FeatureParams.tagToTypeIDMap[tag];
        if (!tagDrivenTypeID) return null;
        const fpTag = fp.cast(tagDrivenTypeID);
        if (!fpTag) return null;
        for (const handler of FeatureParamHandlers) {
            const result = handler.tryWrite(fp);
            if (result) return result;
        }
        return null;
    }
};

type Handler<T> = {
    tryRead(tag: Tag, view: BinaryView): undefined | Sigma.DependentPair;
    tryWrite(fp: Sigma.DependentPair): undefined | Frag;
};
function CreateHandler<T>(tid: Sigma.TypeID<T>, io: Read<T> & Write<T>): Handler<T> {
    return {
        tryRead(tag, view) {
            if (GsubGpos.FeatureParams.tagToTypeIDMap[tag] === tid) {
                return Sigma.DependentPair.create(tid, view.next(io));
            } else {
                return undefined;
            }
        },
        tryWrite(fpRaw) {
            const fp = fpRaw.cast(tid);
            if (fp) return Frag.from(io, fp);
            else return undefined;
        }
    };
}

const FeatureParamStylisticSet = CreateHandler(GsubGpos.FeatureParams.TID_StylisticSet, {
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
});

const FeatureParamCharacterVariant = CreateHandler(GsubGpos.FeatureParams.TID_CharacterVariant, {
    read(view: BinaryView): GsubGpos.FeatureParams.CharacterVariant {
        const format = view.uint16();
        Assert.FormatSupported("FeatureParam::CharacterVariant", format, 0);
        const featUiLabelNameId = view.uint16();
        const featUiTooltipTextNameId = view.uint16();
        const sampleTextNameId = view.uint16();
        const numNamedParameters = view.uint16();
        const firstParamUiLabelNameId = view.uint16();
        const charCount = view.uint16();
        const chars = view.array(charCount, UInt24);

        return {
            featUiLabelNameId,
            featUiTooltipTextNameId,
            sampleTextNameId,
            numNamedParameters,
            firstParamUiLabelNameId,
            characters: chars
        };
    },
    write(frag: Frag, fp: GsubGpos.FeatureParams.CharacterVariant) {
        frag.uint16(0)
            .uint16(fp.featUiLabelNameId)
            .uint16(fp.featUiTooltipTextNameId)
            .uint16(fp.sampleTextNameId)
            .uint16(fp.numNamedParameters)
            .uint16(fp.firstParamUiLabelNameId)
            .uint16(fp.characters.length)
            .array(UInt24, fp.characters);
    }
});

const FeatureParamHandlers = [FeatureParamStylisticSet, FeatureParamCharacterVariant];
