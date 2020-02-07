import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";

export function initialGlyphsFromUnicodeSet<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    unicodeSet: { has(u: number): boolean },
    fAddNotDef: boolean = true,
    fAddNull: boolean = false
) {
    const gOrd = font.glyphs.decideOrder();
    const init: Set<Ot.Glyph> = new Set();
    if (fAddNotDef && gOrd.length > 0) init.add(gOrd.at(0)); // keep NOTDEF
    if (fAddNull && gOrd.length > 1) init.add(gOrd.at(1)); // keep .NULL
    if (font.cmap) {
        for (const [u, glyph] of font.cmap.unicode.entries()) {
            if (unicodeSet.has(u)) init.add(glyph);
        }
        for (const [u, s, glyph] of font.cmap.vs.entries()) {
            if (unicodeSet.has(u)) init.add(glyph);
            if (unicodeSet.has(s)) init.add(glyph);
        }
    }
    return init;
}

export function createSubsetRectifier<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    unicodeSet: { has(u: number): boolean }
) {
    const init = initialGlyphsFromUnicodeSet(font, unicodeSet);
    const collected = Rectify.traceGlyphs(new Set(init), font);
    return {
        glyphs: Array.from(font.glyphs.decideOrder()).filter(x => collected.has(x)),
        rectifier: {
            glyphRef(g: Ot.Glyph) {
                if (collected.has(g)) return g;
                else return undefined;
            }
        }
    };
}
