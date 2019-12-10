import { RectifyImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Data, Rectify } from "@ot-builder/prelude";

import { LookupRemovableAlg } from "./lookup-removable-alg";

export function cleanupGsubGposData<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    lookupCorrespondence: Map<Ot.GsubGpos.Lookup, Ot.GsubGpos.Lookup>
) {
    const newTable = tableFactory();
    const removableAlg = new LookupRemovableAlg();
    let lookups: Ot.GsubGpos.Lookup[] = [];
    for (const lookup of [...lookupCorrespondence.values()]) {
        if (!lookup.acceptLookupAlgebra(removableAlg)) lookups.push(lookup);
    }

    newTable.lookups = lookups;
    const lookupSet = new Set(lookups);
    if (!lookupSet.size) return null;

    let featureCorrespondence: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature> = new Map();
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

function cleanupFeature(
    ft: Ot.GsubGpos.Feature,
    lookupCorrespondence: Map<Ot.GsubGpos.Lookup, Ot.GsubGpos.Lookup>,
    ls: ReadonlySet<Ot.GsubGpos.Lookup>,
    featureCorrespondence: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature>,
    keepEmptyFeature: boolean
): null | Ot.GsubGpos.Feature {
    const l1 = RectifyImpl.Elim.listSome(
        ft.lookups.map(l => lookupCorrespondence.get(l)),
        ls
    );
    if (!keepEmptyFeature && !l1.length) return null;
    const ft1 = { ...ft, lookups: l1 };
    featureCorrespondence.set(ft, ft1);
    return ft1;
}

function cleanupLanguage(
    la: Data.Maybe<Ot.GsubGpos.Language>,
    fs: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature>
): null | Ot.GsubGpos.Language {
    if (!la) return null;
    const requiredFeature1 = RectifyImpl.Elim.findInMap(la.requiredFeature, fs);
    const features1 = RectifyImpl.Elim.listSomeT(la.features, f =>
        RectifyImpl.Elim.findInMap(f, fs)
    );
    if (!features1.length && !requiredFeature1) return null;
    return { requiredFeature: requiredFeature1, features: features1 };
}

function cleanupScript(
    sc: Ot.GsubGpos.Script,
    fs: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature>
): null | Ot.GsubGpos.Script {
    const defaultLanguage = cleanupLanguage(sc.defaultLanguage, fs);
    const languages = RectifyImpl.Elim.comapSomeT(sc.languages, cleanupLanguage, fs);
    if (!defaultLanguage && !languages.size) return null;
    else return { defaultLanguage, languages };
}

function cleanupFeatureVariation(
    fv: Ot.GsubGpos.FeatureVariation,
    lookupCorrespondence: Map<Ot.GsubGpos.Lookup, Ot.GsubGpos.Lookup>,
    ls: ReadonlySet<Ot.GsubGpos.Lookup>,
    featureCorrespondence: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature>,
    fs: ReadonlySet<Ot.GsubGpos.Feature>
): null | Ot.GsubGpos.FeatureVariation {
    let subst: Map<Ot.GsubGpos.Feature, Ot.GsubGpos.Feature> = new Map();
    for (const [from, to] of fv.substitutions) {
        const from1 = RectifyImpl.Elim.findInSet(from, fs);
        const to1 = cleanupFeature(to, lookupCorrespondence, ls, featureCorrespondence, true);
        if (from1 && to1) subst.set(from1, to1);
    }
    if (!subst.size) return null;
    else return { ...fv, substitutions: subst };
}

export function axesRectifyFeatureVariation(
    rec: Rectify.Axis.RectifierT<Ot.Var.Axis>,
    fv: Ot.GsubGpos.FeatureVariation
) {
    fv.conditions = RectifyImpl.listSomeT(rec, fv.conditions, (r, c) => {
        const a1 = r.axis(c.axis);
        if (a1) return { ...c, axis: a1 };
        else return null;
    });
}
