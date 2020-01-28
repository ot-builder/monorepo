import * as Ot from "@ot-builder/font";

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
