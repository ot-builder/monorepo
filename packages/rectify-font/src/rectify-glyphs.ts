import { OtFont } from "@ot-builder/font";
import { OtGlyph, OtGlyphStore, OtGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Rectify } from "@ot-builder/rectify";

function rectifyFontGlyphStore<GS extends OtGlyphStore>(
    rec: Rectify.Glyph.RectifierT<OtGlyph>,
    font: OtFont<GS>,
    gsf: OtGlyphStoreFactory<GS>
) {
    const gOrd = font.glyphs.decideOrder();
    const gList1: OtGlyph[] = [];
    for (const g of gOrd) {
        const g1 = rec.glyph(g);
        if (g1) {
            g1.rectifyGlyphs(rec);
            gList1.push(g1);
        }
    }
    const glyphs1 = gsf.createStoreFromList(gList1);
    font.glyphs = glyphs1;
}

export function rectifyFontGlyphs<GS extends OtGlyphStore>(
    rec: Rectify.Glyph.RectifierT<OtGlyph>,
    font: OtFont<GS>,
    gsf: OtGlyphStoreFactory<GS>
) {
    rectifyFontGlyphStore(rec, font, gsf);
    if (OtFont.isCff(font)) font.cff.rectifyGlyphs(rec);
    if (font.cmap) font.cmap.rectifyGlyphs(rec);
    if (font.gdef) font.gdef.rectifyGlyphs(rec);
    if (font.gsub) {
        font.gsub.rectifyGlyphs(rec);
        const remove = font.gsub.cleanupEliminable();
        if (remove) font.gsub = null;
    }
    if (font.gpos) {
        font.gpos.rectifyGlyphs(rec);
        const remove = font.gpos.cleanupEliminable();
        if (remove) font.gpos = null;
    }
    if (font.base) font.base.rectifyGlyphs(rec);
}
