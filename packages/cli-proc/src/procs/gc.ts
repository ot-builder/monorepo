import * as ImpLib from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { createSubsetRectifier } from "../support/initial-visible-glyphs";

import { consolidateGsubGpos } from "./merge-consolidate/index";

export function gcFont<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    gsf: Ot.GlyphStoreFactory<GS>
) {
    if (font.gsub) cleanupInaccessibleLookups(font.gsub);
    if (font.gpos) cleanupInaccessibleLookups(font.gpos);

    const { glyphs, rectifier } = createSubsetRectifier(font, { has: () => true });
    font.glyphs = gsf.createStoreFromList(glyphs);
    Rectify.inPlaceRectifyFontGlyphReferences(rectifier, font);

    if (font.gpos) font.gpos = consolidateGsubGpos(font.fvar, font.gpos);
    if (font.gsub) font.gsub = consolidateGsubGpos(font.fvar, font.gsub);
}

function cleanupInaccessibleLookups<L, Table extends Ot.GsubGpos.TableT<L>>(table: Table) {
    const keptFeatures = new Set<Ot.GsubGpos.FeatureT<L>>();
    for (const script of table.scripts.values()) {
        if (script.defaultLanguage)
            collectAccessibleFeatures(script.defaultLanguage, keptFeatures);
        for (const lang of script.languages.values())
            collectAccessibleFeatures(lang, keptFeatures);
    }

    const keptLookups = new Set<L>();
    for (const feature of table.features) {
        if (!keptFeatures.has(feature)) emptyFeature(feature);
        else for (const lookup of feature.lookups) keptLookups.add(lookup);
    }
    if (table.featureVariations) {
        for (const fv of table.featureVariations) {
            for (const [from, to] of fv.substitutions) {
                if (!keptFeatures.has(from)) emptyFeature(to);
                else for (const lookup of to.lookups) keptLookups.add(lookup);
            }
        }
    }

    ImpLib.ArrayHelper.inPlaceShrinkArray(keptLookups, table.lookups);
}

function collectAccessibleFeatures<L>(
    lang: Ot.GsubGpos.LanguageT<L>,
    sink: Set<Ot.GsubGpos.FeatureT<L>>
) {
    if (lang.requiredFeature) sink.add(lang.requiredFeature);
    for (const feature of lang.features) sink.add(feature);
}

function emptyFeature<L>(f: Ot.GsubGpos.FeatureT<L>) {
    f.lookups = [];
    f.params = null;
}
