import { Gdef, LayoutCommon } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";

export interface IgnoreFlagOptions {
    ignoreBaseGlyphs: boolean;
    ignoreLigatures: boolean;
    ignoreMarks: boolean;
    markAttachmentType?: number;
    markFilteringSet?: number;
}

export function decideIgnoreFlags<G, X>(
    gs: Data.Maybe<ReadonlySet<G>>,
    fn: Data.Maybe<Gdef.TableT<G, X>>
): null | IgnoreFlagOptions {
    if (!fn) return null;
    return (
        igfEmpty(gs) ||
        igfGlyphClass(gs, fn.glyphClassDef) ||
        igcMarkAttachmentClass(gs, fn.markAttachClassDef) ||
        igfMarkGlyphSet(gs, fn.markGlyphSets)
    );
}

function igfEmpty<G>(gs: Data.Maybe<ReadonlySet<G>>) {
    if (!gs || !gs.size) {
        return {
            ignoreBaseGlyphs: false,
            ignoreLigatures: false,
            ignoreMarks: false
        };
    }
    return null;
}

class HasAllState {
    public has = false;
    public all = true;
    public update(x: boolean) {
        if (x) this.has = true;
        else this.all = false;
    }
    get mix() {
        return this.has && !this.all;
    }
}

function igfGlyphClass<G>(
    gs: Data.Maybe<ReadonlySet<G>>,
    cd: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): null | IgnoreFlagOptions {
    if (!gs || !gs.size || !cd) return null;
    let base = new HasAllState(),
        ligature = new HasAllState(),
        mark = new HasAllState();
    let cov: Set<G> = new Set();
    for (const [g, cl] of cd) {
        const inSet = gs.has(g);
        switch (cl) {
            case Gdef.GlyphClass.Base:
                base.update(inSet);
                cov.add(g);
                break;
            case Gdef.GlyphClass.Ligature:
                ligature.update(inSet);
                cov.add(g);
                break;
            case Gdef.GlyphClass.Mark:
                mark.update(inSet);
                cov.add(g);
        }
    }
    if (base.mix || ligature.mix || mark.mix) return null;
    for (const g of gs) if (!cov.has(g)) return null;
    return {
        ignoreBaseGlyphs: base.has,
        ignoreLigatures: ligature.has,
        ignoreMarks: mark.has
    };
}

function igcMarkAttachmentClass<G>(
    gs: Data.Maybe<ReadonlySet<G>>,
    maCd: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): null | IgnoreFlagOptions {
    if (!gs || !gs.size || !maCd) return null;

    // Get an matching mark class
    let kMark: undefined | number = undefined;
    for (const g of gs) {
        const kg = maCd.get(g);
        if (kg === undefined) return null;
        if (kMark === undefined) kMark = kg;
        else if (kg !== kMark) return null;
    }

    // ensure the glyph set satisfying this mark class equal to GS
    if (kMark === undefined) return null;
    for (const [g, cl] of maCd) {
        if (cl === kMark && !gs.has(g)) return null;
    }
    return {
        ignoreBaseGlyphs: false,
        ignoreLigatures: false,
        ignoreMarks: false,
        markAttachmentType: kMark
    };
}

function setEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
    for (let g of a) if (!b.has(g)) return false;
    for (let g of b) if (!a.has(g)) return false;
    return true;
}

function igfMarkGlyphSet<G>(
    gs: Data.Maybe<ReadonlySet<G>>,
    mgs: Data.Maybe<Array<ReadonlySet<G>>>
): null | IgnoreFlagOptions {
    if (!mgs || !gs || !gs.size) return null;
    for (let mgsIndex = 0; mgsIndex < mgs.length; mgsIndex++) {
        if (setEqual(gs, mgs[mgsIndex])) {
            return {
                ignoreBaseGlyphs: false,
                ignoreLigatures: false,
                ignoreMarks: false,
                markFilteringSet: mgsIndex
            };
        }
    }
    return null;
}
