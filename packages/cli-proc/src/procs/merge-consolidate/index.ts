import { ImpLib } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/ot";
import { Data } from "@ot-builder/prelude";
import * as Rectify from "@ot-builder/rectify";

import { DesignUnifierSession, unifyDesignSpacesImpl } from "../../support/design-unifier";

import { GsubGposMerger } from "./gsub-gpos-merger";
import { mergeMapOpt, Prime, combineList, mergeMap } from "./utils";

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

export function consolidateFont<GS extends Ot.GlyphStore>(font: Ot.Font<GS>) {
    const gs = new Set(font.glyphs.decideOrder());
    const rectifier: Rectify.GlyphReferenceRectifier = {
        glyphRef: g => (gs.has(g) ? g : null)
    };
    Rectify.rectifyFontGlyphReferences(rectifier, font);

    if (font.gpos) font.gpos = consolidateGsubGpos(font.fvar, font.gpos);
    if (font.gsub) font.gsub = consolidateGsubGpos(font.fvar, font.gsub);
}

// TODO: Add CFF merging
function mergeFontTables(basis: Ot.Font, override: Ot.Font, opt: MergeOptions) {
    if (opt.preferOverride) {
        basis.cmap = mergeCmap(override.cmap, basis.cmap);
        basis.gsub = mergeGsubGpos(override.fvar, override.gsub, basis.gsub);
        basis.gpos = mergeGsubGpos(override.fvar, override.gpos, basis.gpos);
        basis.gdef = mergeGdef(override.gdef, basis.gdef);
    } else {
        basis.cmap = mergeCmap(basis.cmap, override.cmap);
        basis.gsub = mergeGsubGpos(basis.fvar, basis.gsub, override.gsub);
        basis.gpos = mergeGsubGpos(basis.fvar, basis.gpos, override.gpos);
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
    fvar: Data.Maybe<Ot.Fvar.Table>,
    preferred: Data.Maybe<Ot.GsubGpos.TableT<L>>,
    less: Data.Maybe<Ot.GsubGpos.TableT<L>>
) {
    if (!preferred) return less;
    if (!less) return preferred;

    const merger = new GsubGposMerger(
        ImpLib.Order.fromList("Dimensions", fvar ? fvar.axes.map(a => a.dim) : []),
        preferred,
        less
    );
    return merger.resolve();
}

function consolidateGsubGpos<L>(
    fvar: Data.Maybe<Ot.Fvar.Table>,
    preferred: Ot.GsubGpos.TableT<L>
) {
    const merger = new GsubGposMerger(
        ImpLib.Order.fromList("Dimensions", fvar ? fvar.axes.map(a => a.dim) : []),
        preferred,
        { scripts: new Map(), features: [], lookups: [], featureVariations: [] }
    );
    return merger.resolve();
}
