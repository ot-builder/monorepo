import * as Ot from "@ot-builder/ot";
import { Data } from "@ot-builder/prelude";

import { AxisRectifier } from "../../interface";
import { RectifyImpl } from "../../shared";

export interface LookupCleaner<L> {
    lookupRemovable(lookup: L): boolean;
    cleanupBrokenCrossLinks: (lookup: L, validLookupSet: Set<L>) => void;
}

export function cleanupGsubGposData<L, Table extends Ot.GsubGpos.TableT<L>>(
    table: Table,
    newTable: Table,
    lookupCorrespondence: Map<L, L>,
    cleaner: LookupCleaner<L>
) {
    const lookups = cleanupLookups([...lookupCorrespondence.values()], cleaner);

    newTable.lookups = lookups;
    const lookupSet = new Set(lookups);
    if (!lookupSet.size) return null;

    const featureCorrespondence: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>> = new Map();
    newTable.features = RectifyImpl.Elim.listSomeT(
        table.features,
        cleanupFeature,
        lookupCorrespondence,
        lookupSet,
        featureCorrespondence,
        !!table.featureVariations
    );
    const featureSet = new Set(newTable.features);

    newTable.scripts = RectifyImpl.Elim.comapSomeT(
        table.scripts,
        cleanupScript,
        featureCorrespondence
    );

    if (table.featureVariations) {
        newTable.featureVariations = RectifyImpl.Elim.listSomeT(
            table.featureVariations,
            cleanupFeatureVariation,
            lookupCorrespondence,
            lookupSet,
            featureCorrespondence,
            featureSet
        );
        if (!newTable.featureVariations.length) newTable.featureVariations = null;
    }

    return newTable;
}

function cleanupLookups<L>(source: L[], cleaner: LookupCleaner<L>): L[] {
    let lookups: L[] = source;
    let n = lookups.length;
    let n1 = n;

    do {
        n = n1;
        const lookups1: L[] = [];
        for (const lookup of lookups) {
            if (!cleaner.lookupRemovable(lookup)) lookups1.push(lookup);
        }

        const validSet = new Set(lookups1);
        for (const lookup of lookups1) cleaner.cleanupBrokenCrossLinks(lookup, validSet);
        n1 = lookups1.length;
        lookups = lookups1;
    } while (n1 < n);
    return lookups;
}

function cleanupFeature<L>(
    ft: Ot.GsubGpos.FeatureT<L>,
    lookupCorrespondence: Map<L, L>,
    ls: ReadonlySet<L>,
    featureCorrespondence: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>>,
    keepEmptyFeature: boolean
): null | Ot.GsubGpos.FeatureT<L> {
    const l1 = RectifyImpl.Elim.listSome(
        ft.lookups.map(l => lookupCorrespondence.get(l)),
        ls
    );
    if (!keepEmptyFeature && !l1.length) return null;
    const ft1 = { ...ft, lookups: l1 };
    featureCorrespondence.set(ft, ft1);
    return ft1;
}

function cleanupLanguage<L>(
    la: Data.Maybe<Ot.GsubGpos.LanguageT<L>>,
    fs: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>>
): null | Ot.GsubGpos.LanguageT<L> {
    if (!la) return null;
    const requiredFeature1 = RectifyImpl.Elim.findInMap(la.requiredFeature, fs);
    const features1 = RectifyImpl.Elim.listSomeT(la.features, f =>
        RectifyImpl.Elim.findInMap(f, fs)
    );
    if (!features1.length && !requiredFeature1) return null;
    return { requiredFeature: requiredFeature1, features: features1 };
}

function cleanupScript<L>(
    sc: Ot.GsubGpos.ScriptT<L>,
    fs: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>>
): null | Ot.GsubGpos.ScriptT<L> {
    const defaultLanguage = cleanupLanguage(sc.defaultLanguage, fs);
    const languages = RectifyImpl.Elim.comapSomeT(sc.languages, cleanupLanguage, fs);
    if (!defaultLanguage && !languages.size) return null;
    else return { defaultLanguage, languages };
}

function cleanupFeatureVariation<L>(
    fv: Ot.GsubGpos.FeatureVariationT<L>,
    lookupCorrespondence: Map<L, L>,
    ls: ReadonlySet<L>,
    featureCorrespondence: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>>,
    fs: ReadonlySet<Ot.GsubGpos.FeatureT<L>>
): null | Ot.GsubGpos.FeatureVariationT<L> {
    const subst: Map<Ot.GsubGpos.FeatureT<L>, Ot.GsubGpos.FeatureT<L>> = new Map();
    for (const [from, to] of fv.substitutions) {
        const from1 = RectifyImpl.Elim.findInSet(featureCorrespondence.get(from) || from, fs);
        const to1 = cleanupFeature(to, lookupCorrespondence, ls, featureCorrespondence, true);
        if (from1 && to1) subst.set(from1, to1);
    }
    if (!subst.size) return null;
    else return { ...fv, substitutions: subst };
}

export function axesRectifyFeatureVariation<L>(
    rec: AxisRectifier,
    fv: Ot.GsubGpos.FeatureVariationT<L>
) {
    fv.conditions = RectifyImpl.listSomeT(rec, fv.conditions, (r, c) => {
        const a1 = r.dim(c.dim);
        if (a1) return { ...c, dim: a1 };
        else return null;
    });
}
