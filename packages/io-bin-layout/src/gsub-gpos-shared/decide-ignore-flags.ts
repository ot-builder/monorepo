import { Gdef, LayoutCommon } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

export interface IgnoreFlagOptions {
    ignoreBaseGlyphs?: boolean;
    ignoreLigatures?: boolean;
    ignoreMarks?: boolean;
    markAttachmentType?: number;
    markFilteringSet?: number;
}

export function decideIgnoreFlags<G, X>(
    gs: Data.Maybe<ReadonlySet<G>>,
    gdef: Data.Maybe<Gdef.General.TableT<G, X>>
): null | IgnoreFlagOptions {
    if (!gdef || !gs || !gs.size) return null;

    const [nonMarks, marks] = gsSplitMarks(gs, gdef.glyphClassDef);

    const igfBase = igfGlyphClass(
        nonMarks,
        gdef.glyphClassDef,
        Gdef.GlyphClass.Base,
        { ignoreBaseGlyphs: true },
        { ignoreBaseGlyphs: false }
    );

    const igfLigature = igfGlyphClass(
        nonMarks,
        gdef.glyphClassDef,
        Gdef.GlyphClass.Ligature,
        { ignoreLigatures: true },
        { ignoreLigatures: false }
    );

    const igfMark =
        igfGlyphClass(
            marks,
            gdef.glyphClassDef,
            Gdef.GlyphClass.Mark,
            { ignoreMarks: true },
            { ignoreMarks: false }
        ) ||
        igfMarkAttachmentClass(marks, gdef.glyphClassDef, gdef.markAttachClassDef) ||
        igfMarkFilterSet(marks, gdef.glyphClassDef, gdef.markGlyphSets);

    return {
        ...igfBase,
        ...igfLigature,
        ...igfMark
    };
}

/// Split non-mark and mark glyphs
function gsSplitMarks<G>(
    ignoredGlyphs: ReadonlySet<G>,
    glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): [Set<G>, Set<G>] {
    if (!glyphClassDef) return [new Set(ignoredGlyphs), new Set()];

    const marks = new Set<G>(),
        nonMarks = new Set<G>();
    for (const g of ignoredGlyphs) {
        if (Gdef.GlyphClass.Mark === glyphClassDef.get(g)) {
            marks.add(g);
        } else {
            nonMarks.add(g);
        }
    }

    return [nonMarks, marks];
}

function igfGlyphClass<G>(
    ignoredGlyphs: ReadonlySet<G>,
    glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>>,
    glyphClass: Gdef.GlyphClass,
    positive: IgnoreFlagOptions,
    negative: IgnoreFlagOptions
): null | IgnoreFlagOptions {
    if (!glyphClassDef) return null;

    let has = false,
        all = true;
    for (const [g, cl] of glyphClassDef) {
        if (cl !== glyphClass) continue;
        if (ignoredGlyphs.has(g)) {
            has = true;
        } else {
            all = false;
        }
    }

    if (!has) {
        return negative;
    } else if (all) {
        return positive;
    } else {
        return null;
    }
}

function igfMarkAttachmentClass<G>(
    ignoredMarks: ReadonlySet<G>,
    glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>>,
    markAttachmentClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>>
): null | IgnoreFlagOptions {
    if (!glyphClassDef || !markAttachmentClassDef) return null;

    // We need to iterate through all the marks, since in some cases we are ignoring mark class "0"
    const keptMarkClasses = new Set<number>();
    const ignoredMarkClasses = new Set<number>();
    for (const [g, gc] of glyphClassDef) {
        if (gc !== Gdef.GlyphClass.Mark) continue;
        const k = markAttachmentClassDef.get(g) || 0;
        (ignoredMarks.has(g) ? ignoredMarkClasses : keptMarkClasses).add(k);
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

    return { markAttachmentType: finalMarkClass };
}

function igfMarkFilterSet<G>(
    ignoredMarks: ReadonlySet<G>,
    glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>>,
    markGlyphSets: Data.Maybe<Array<ReadonlySet<G>>>
): null | IgnoreFlagOptions {
    if (!glyphClassDef || !markGlyphSets) return null;
    out: for (let mgsIndex = 0; mgsIndex < markGlyphSets.length; mgsIndex++) {
        const mgs = markGlyphSets[mgsIndex];
        for (const [g, gc] of glyphClassDef) {
            if (gc !== Gdef.GlyphClass.Mark) continue;
            if (ignoredMarks.has(g) !== !mgs.has(g)) continue out;
        }
        return { markFilteringSet: mgsIndex };
    }
    return null;
}
