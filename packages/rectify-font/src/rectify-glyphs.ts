import { OtFont } from "@ot-builder/font";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Rectify } from "@ot-builder/prelude";

function rectifyFontGlyphStore<GS extends Data.OrderStore<OtGlyph>>(
    rec: Rectify.Glyph.RectifierT<OtGlyph>,
    font: OtFont<GS>,
    gsf: Data.OrderStoreFactory<OtGlyph, GS>
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

export function rectifyFontGlyphs<GS extends Data.OrderStore<OtGlyph>>(
    rec: Rectify.Glyph.RectifierT<OtGlyph>,
    font: OtFont<GS>,
    gsf: Data.OrderStoreFactory<OtGlyph, GS>
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
