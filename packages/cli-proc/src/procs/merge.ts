import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";

import { DesignUnifierSession, unifyDesignSpacesImpl } from "../support/design-unifier";

export type MergeOptions = { preferOverride?: boolean };

export function mergeFonts<GS extends Ot.GlyphStore, GS2 extends Ot.GlyphStore>(
    basis: Ot.Font<GS>,
    override: Ot.Font<GS2>,
    gsf: Ot.GlyphStoreFactory<GS>,
    opt: MergeOptions = {}
) {
    unifyDesignSpacesImpl(new DesignUnifierSession(), basis, override);
    basis.glyphs = gsf.createStoreFromList([
        ...basis.glyphs.decideOrder(),
        ...override.glyphs.decideOrder()
    ]);
    mergeFontTables(basis, override, opt);
}

// TODO: add CFF merging
function mergeFontTables(basis: Ot.Font, override: Ot.Font, opt: MergeOptions) {
    if (opt.preferOverride) {
        basis.cmap = mergeCmap(override.cmap, basis.cmap);
        basis.gsub = mergeGsubGpos(override.gsub, basis.gsub);
        basis.gpos = mergeGsubGpos(override.gpos, basis.gpos);
        basis.gdef = mergeGdef(override.gdef, basis.gdef);
    } else {
        basis.cmap = mergeCmap(basis.cmap, override.cmap);
        basis.gsub = mergeGsubGpos(basis.gsub, override.gsub);
        basis.gpos = mergeGsubGpos(basis.gpos, override.gpos);
        basis.gdef = mergeGdef(basis.gdef, override.gdef);
    }
}

function mergeCmap(preferred: Data.Maybe<Ot.Cmap.Table>, less: Data.Maybe<Ot.Cmap.Table>) {
    if (!preferred) return less;
    if (!less) return preferred;
    for (const [u, g] of less.unicode.entries()) {
        if (!preferred.unicode.get(u)) preferred.unicode.set(u, g);
    }
    for (const [u, s, g] of less.vs.entries()) {
        if (!preferred.vs.get(u, s)) preferred.vs.set(u, s, g);
    }
    return preferred;
}

function mergeGdef(preferred: Data.Maybe<Ot.Gdef.Table>, less: Data.Maybe<Ot.Gdef.Table>) {
    if (!preferred) return less;
    if (!less) return preferred;

    const result = new Ot.Gdef.Table();
    result.glyphClassDef = mergeMapOpt(preferred.glyphClassDef, less.glyphClassDef, Prime);
    result.attachList = mergeMapOpt(preferred.attachList, less.attachList, Prime);
    result.ligCarets = mergeMapOpt(preferred.ligCarets, less.ligCarets, Prime);
    result.markAttachClassDef = mergeMapOpt(
        preferred.markAttachClassDef,
        less.markAttachClassDef,
        Prime
    );
    result.markGlyphSets = combineList(preferred.markGlyphSets, less.markGlyphSets);
    return result;
}

function mergeGsubGpos<L>(
    preferred: Data.Maybe<Ot.GsubGpos.TableT<L>>,
    less: Data.Maybe<Ot.GsubGpos.TableT<L>>
): Data.Maybe<Ot.GsubGpos.TableT<L>> {
    if (!preferred) return less;
    if (!less) return preferred;

    const featureVariations = combineList(preferred.featureVariations, less.featureVariations);
    const lookups = [...preferred.lookups, ...less.lookups];
    const features = [...preferred.features, ...less.features];
    const scripts = mergeMap(preferred.scripts, less.scripts, mergeGsubGposScript);

    return { scripts, features, lookups, featureVariations };
}

function mergeGsubGposScript<L>(
    preferred: Ot.GsubGpos.ScriptT<L>,
    less: Ot.GsubGpos.ScriptT<L>
): Ot.GsubGpos.ScriptT<L> {
    return {
        defaultLanguage: mergeGsubGposLanguage(preferred.defaultLanguage, less.defaultLanguage),
        languages: mergeMap(preferred.languages, less.languages, mergeGsubGposLanguageImpl)
    };
}
function mergeGsubGposLanguage<L>(
    preferred: Data.Maybe<Ot.GsubGpos.LanguageT<L>>,
    less: Data.Maybe<Ot.GsubGpos.LanguageT<L>>
): Data.Maybe<Ot.GsubGpos.LanguageT<L>> {
    if (!preferred) return less;
    if (!less) return preferred;
    return mergeGsubGposLanguageImpl(preferred, less);
}
function mergeGsubGposLanguageImpl<L>(
    preferred: Ot.GsubGpos.LanguageT<L>,
    less: Ot.GsubGpos.LanguageT<L>
): Ot.GsubGpos.LanguageT<L> {
    return {
        requiredFeature: preferred.requiredFeature || less.requiredFeature, // TODO: combine feature?
        features: combineList(preferred.features, less.features)
    };
}

///////////////////////////////////////////////////////////////////////////////////////////////////

function combineList<T>(a: Data.Maybe<ReadonlyArray<T>>, b: Data.Maybe<ReadonlyArray<T>>) {
    return [...(a || []), ...(a || [])];
}

function mergeMapOpt<K, V>(
    prime: Data.Maybe<Map<K, V>>,
    basis: Data.Maybe<Map<K, V>>,
    mergeValue: (a: V, b: V) => V
): Data.Maybe<Map<K, V>> {
    if (!prime) return basis;
    if (!basis) return prime;
    return mergeMap(prime, basis, mergeValue);
}
function mergeMap<K, V>(
    prime: Map<K, V>,
    basis: Map<K, V>,
    mergeValue: (a: V, b: V) => V
): Map<K, V> {
    const m: Map<K, V> = new Map(basis);
    for (const [k, v] of prime) {
        if (m.has(k)) {
            m.set(k, mergeValue(m.get(k)!, v));
        } else {
            m.set(k, v);
        }
    }
    return m;
}

function Prime<K>(a: K, b: K) {
    return a;
}
