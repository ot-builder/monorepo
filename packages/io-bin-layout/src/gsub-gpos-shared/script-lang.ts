import { BinaryView, Frag } from "@ot-builder/bin-util";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { NullablePtr16, Tag, UInt16 } from "@ot-builder/primitive";

type Feature = GsubGpos.FeatureT<GsubGpos.Lookup>;
type LangSys = GsubGpos.LanguageT<GsubGpos.Lookup>;
type Script = GsubGpos.ScriptT<GsubGpos.Lookup>;

const LangSysTable = {
    read(view: BinaryView, fOrd: Data.Order<Feature>): LangSys {
        const vLookupOrder = view.ptr16Nullable(); // Reserved, keep zero
        const requiredFeature = fOrd.tryAt(view.uint16()); // 0xFFFF should return undefined
        const featureIndexCount = view.uint16();
        const features = view.array(featureIndexCount, UInt16).map(id => fOrd.at(id));
        return { requiredFeature, features };
    },
    write(frag: Frag, lang: LangSys, fOrd: Data.Order<Feature>) {
        frag.uint16(0);
        frag.uint16(fOrd.tryReverseFallback(lang.requiredFeature, 0xffff));
        frag.uint16(lang.features.length);
        frag.array(UInt16, lang.features.map(f => fOrd.reverse(f)));
    }
};

const Ptr16LangSysTable = NullablePtr16(LangSysTable);

const ScriptTable = {
    read(view: BinaryView, fOrd: Data.Order<Feature>) {
        const defaultLangSys = view.next(Ptr16LangSysTable, fOrd);
        const langSysCount = view.uint16();
        const script: Script = { defaultLanguage: defaultLangSys, languages: new Map() };
        for (let lid = 0; lid < langSysCount; lid++) {
            const langSysTag = view.next(Tag);
            const lang = view.ptr16().next(LangSysTable, fOrd);
            script.languages.set(langSysTag, lang);
        }
        return script;
    },
    write(frag: Frag, script: Script, fOrd: Data.Order<Feature>) {
        frag.push(Ptr16LangSysTable, script.defaultLanguage, fOrd);
        const langs = [...script.languages].sort((a, b) =>
            a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
        );
        frag.uint16(langs.length);
        for (const [tag, lang] of langs) {
            frag.push(Tag, tag);
            frag.ptr16New().push(LangSysTable, lang, fOrd);
        }
    }
};

export const ScriptList = {
    read(view: BinaryView, fOrd: Data.Order<Feature>) {
        const scriptCount = view.uint16();
        const scripts: Map<Tag, Script> = new Map();
        for (let lid = 0; lid < scriptCount; lid++) {
            const tag = view.next(Tag);
            const script = view.ptr16().next(ScriptTable, fOrd);
            scripts.set(tag, script);
        }
        return scripts;
    },
    write(frag: Frag, scripts: Map<Tag, Script>, fOrd: Data.Order<Feature>) {
        const ss = [...scripts].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        frag.uint16(ss.length);
        for (const [tag, script] of ss) {
            frag.push(Tag, tag);
            frag.ptr16New().push(ScriptTable, script, fOrd);
        }
    }
};
