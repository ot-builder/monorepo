import { NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { Tag, UInt16 } from "@ot-builder/primitive";

type Feature<L> = GsubGpos.FeatureT<L>;
type LangSys<L> = GsubGpos.LanguageT<L>;
type Script<L> = GsubGpos.ScriptT<L>;

class CLangSysTable<L> {
    public read(view: BinaryView, fOrd: Data.Order<Feature<L>>): LangSys<L> {
        const vLookupOrder = view.ptr16Nullable(); // Reserved, keep zero
        const requiredFeature = fOrd.tryAt(view.uint16()); // 0xFFFF should return undefined
        const featureIndexCount = view.uint16();
        const features = view.array(featureIndexCount, UInt16).map(id => fOrd.at(id));
        return { requiredFeature, features };
    }
    public write(frag: Frag, lang: LangSys<L>, fOrd: Data.Order<Feature<L>>) {
        frag.uint16(0);
        frag.uint16(fOrd.tryReverseFallback(lang.requiredFeature, 0xffff));
        frag.uint16(lang.features.length);
        frag.array(
            UInt16,
            lang.features.map(f => fOrd.reverse(f))
        );
    }
}

function CPtr16LangSysTable<L>() {
    return NullablePtr16(new CLangSysTable<L>());
}

class CScriptTable<L> {
    public read(view: BinaryView, fOrd: Data.Order<Feature<L>>) {
        const defaultLangSys = view.next(CPtr16LangSysTable<L>(), fOrd);
        const langSysCount = view.uint16();
        const script: Script<L> = { defaultLanguage: defaultLangSys, languages: new Map() };
        for (let lid = 0; lid < langSysCount; lid++) {
            const langSysTag = view.next(Tag);
            const lang = view.ptr16().next(new CLangSysTable<L>(), fOrd);
            script.languages.set(langSysTag, lang);
        }
        return script;
    }
    public write(frag: Frag, script: Script<L>, fOrd: Data.Order<Feature<L>>) {
        frag.push(CPtr16LangSysTable<L>(), script.defaultLanguage, fOrd);
        const langs = [...script.languages].sort((a, b) =>
            a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
        );
        frag.uint16(langs.length);
        for (const [tag, lang] of langs) {
            frag.push(Tag, tag);
            frag.ptr16New().push(new CLangSysTable<L>(), lang, fOrd);
        }
    }
}

export class CScriptList<L> {
    public read(view: BinaryView, fOrd: Data.Order<Feature<L>>) {
        const scriptCount = view.uint16();
        const scripts: Map<Tag, Script<L>> = new Map();
        for (let lid = 0; lid < scriptCount; lid++) {
            const tag = view.next(Tag);
            const script = view.ptr16().next(new CScriptTable<L>(), fOrd);
            scripts.set(tag, script);
        }
        return scripts;
    }
    public write(frag: Frag, scripts: Map<Tag, Script<L>>, fOrd: Data.Order<Feature<L>>) {
        const ss = [...scripts].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        frag.uint16(ss.length);
        for (const [tag, script] of ss) {
            frag.push(Tag, tag);
            frag.ptr16New().push(new CScriptTable<L>(), script, fOrd);
        }
    }
}
