import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";
import { ParseResult } from "../argv-parser";
import { CliAction, Syntax } from "../command";
import { unifyDesignSpaces } from "../support/design-unifier";

export const MergeSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--merge")) return ParseResult(st, null);

        return ParseResult(st.next(), async state => {
            const add = state.pop();
            if (!add) throw new RangeError("Stack size invalid. No font to do GC.");
            const into = state.pop();
            if (!into) throw new RangeError("Stack size invalid. No font to do GC.");

            console.log(`Merge font ${into} <- ${add}`);
            const merged = mergeFonts(into.font, add.font, {}, Ot.ListGlyphStoreFactory);
            state.push(into.fill(merged));
        });
    }
};

///////////////////////////////////////////////////////////////////////////////////////////////////

export type MergeOption = { preferOverride?: boolean };

export function mergeFonts<GS extends Ot.GlyphStore>(
    into: Ot.Font,
    add: Ot.Font,
    opt: MergeOption,
    gsf: Ot.GlyphStoreFactory<GS>
): Ot.Font<GS> {
    unifyDesignSpaces([into, add]);
    const glyphs = gsf.createStoreFromList([
        ...into.glyphs.decideOrder(),
        ...add.glyphs.decideOrder()
    ]);
    return { ...into, glyphs, ...mergeFontTables(into, add, opt) };
}

// TODO: add CFF merging
function mergeFontTables(into: Ot.Font, add: Ot.Font, opt: MergeOption) {
    if (opt.preferOverride) {
        return {
            cmap: mergeCmap(add.cmap, into.cmap),
            gsub: mergeGsubGpos(add.gsub, into.gsub),
            gpos: mergeGsubGpos(add.gpos, into.gpos),
            gdef: mergeGdef(add.gdef, into.gdef)
        };
    } else {
        return {
            cmap: mergeCmap(into.cmap, add.cmap),
            gsub: mergeGsubGpos(into.gsub, add.gsub),
            gpos: mergeGsubGpos(into.gpos, add.gpos),
            gdef: mergeGdef(into.gdef, add.gdef)
        };
    }
}

function mergeCmap(prime: Data.Maybe<Ot.Cmap.Table>, basis: Data.Maybe<Ot.Cmap.Table>) {
    if (!prime) return basis;
    if (!basis) return prime;
    for (const [u, g] of basis.unicode.entries()) {
        if (!prime.unicode.get(u)) prime.unicode.set(u, g);
    }
    for (const [u, s, g] of basis.vs.entries()) {
        if (!prime.vs.get(u, s)) prime.vs.set(u, s, g);
    }
    return prime;
}

function mergeGdef(prime: Data.Maybe<Ot.Gdef.Table>, basis: Data.Maybe<Ot.Gdef.Table>) {
    if (!prime) return basis;
    if (!basis) return prime;

    const result = new Ot.Gdef.Table();
    result.glyphClassDef = mergeMapOpt(prime.glyphClassDef, basis.glyphClassDef, Prime);
    result.attachList = mergeMapOpt(prime.attachList, basis.attachList, Prime);
    result.ligCarets = mergeMapOpt(prime.ligCarets, basis.ligCarets, Prime);
    result.markAttachClassDef = mergeMapOpt(
        prime.markAttachClassDef,
        basis.markAttachClassDef,
        Prime
    );
    result.markGlyphSets = combineList(prime.markGlyphSets, basis.markGlyphSets);
    return result;
}

function mergeGsubGpos<L>(
    prime: Data.Maybe<Ot.GsubGpos.TableT<L>>,
    basis: Data.Maybe<Ot.GsubGpos.TableT<L>>
): Data.Maybe<Ot.GsubGpos.TableT<L>> {
    if (!prime) return basis;
    if (!basis) return prime;

    const featureVariations = combineList(prime.featureVariations, basis.featureVariations);
    const lookups = [...prime.lookups, ...basis.lookups];
    const features = [...prime.features, ...basis.features];
    const scripts = mergeMap(prime.scripts, basis.scripts, mergeGsubGposScript);

    return { scripts, features, lookups, featureVariations };
}

function mergeGsubGposScript<L>(
    prime: Ot.GsubGpos.ScriptT<L>,
    basis: Ot.GsubGpos.ScriptT<L>
): Ot.GsubGpos.ScriptT<L> {
    return {
        defaultLanguage: mergeGsubGposLanguage(prime.defaultLanguage, basis.defaultLanguage),
        languages: mergeMap(prime.languages, basis.languages, mergeGsubGposLanguageImpl)
    };
}
function mergeGsubGposLanguage<L>(
    prime: Data.Maybe<Ot.GsubGpos.LanguageT<L>>,
    basis: Data.Maybe<Ot.GsubGpos.LanguageT<L>>
): Data.Maybe<Ot.GsubGpos.LanguageT<L>> {
    if (!prime) return basis;
    if (!basis) return prime;
    return mergeGsubGposLanguageImpl(prime, basis);
}
function mergeGsubGposLanguageImpl<L>(
    prime: Ot.GsubGpos.LanguageT<L>,
    basis: Ot.GsubGpos.LanguageT<L>
): Ot.GsubGpos.LanguageT<L> {
    return {
        requiredFeature: prime.requiredFeature || basis.requiredFeature, // TODO: combine feature?
        features: combineList(prime.features, basis.features)
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
