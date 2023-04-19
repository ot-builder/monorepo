import { Gdef, LayoutCommon } from "@ot-builder/ot-layout";
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
    gdef: Data.Maybe<Gdef.General.TableT<G, X>>
): null | IgnoreFlagOptions {
    if (!gdef) return null;
    return (
        igfEmpty(gs) ||
        igfGlyphClass(gs, gdef.glyphClassDef) ||
        igcMarkAttachmentClass(gs, gdef.glyphClassDef, gdef.markAttachClassDef) ||
        igfMarkGlyphSet(gs, gdef.markGlyphSets)
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
    public get mix() {
        return this.has && !this.all;
    }
}

function igfGlyphClass<G>(
    gs: Data.Maybe<ReadonlySet<G>>,
    cd: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): null | IgnoreFlagOptions {
    if (!gs || !gs.size || !cd) return null;
    const base = new HasAllState(),
        ligature = new HasAllState(),
        mark = new HasAllState();
    const cov: Set<G> = new Set();
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
    cd: Data.Maybe<LayoutCommon.ClassDef.T<G>>,
    maCd: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): null | IgnoreFlagOptions {
    if (!gs || !gs.size || !cd || !maCd) return null;

    const keptMarkClasses = new Set<number>();
    const ignoredMarkClasses = new Set<number>();
    for (const [g, gc] of cd) {
        if (gc !== Gdef.GlyphClass.Mark) continue;
        const k = maCd.get(g) || 0;
        (gs.has(g) ? ignoredMarkClasses : keptMarkClasses).add(k);
    }

    let finalMarkClass: undefined | number = undefined;
    for (const k of keptMarkClasses) {
        // Hybrid class, fail
        if (ignoredMarkClasses.has(k)) return null;
        // Multiple mark classes to keep, fail
        if (finalMarkClass != undefined) return null;
        finalMarkClass = k;
    }

    // Nothing to keep, fail
    if (!finalMarkClass || finalMarkClass <= 0 || finalMarkClass > 0xff) return null;

    return {
        ignoreBaseGlyphs: false,
        ignoreLigatures: false,
        ignoreMarks: false,
        markAttachmentType: finalMarkClass
    };
}

function setEqual<T>(a: ReadonlySet<T>, b: ReadonlySet<T>) {
    for (const g of a) if (!b.has(g)) return false;
    for (const g of b) if (!a.has(g)) return false;
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
