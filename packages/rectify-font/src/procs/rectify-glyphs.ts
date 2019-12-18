import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";

import { rectifyGlyphCmap } from "../encoding";
import { inPlaceRectifyGlyphCffTable } from "../glyph-store/cff";
import { RectifyGeomGlyphAlg } from "../glyph/glyph-alg";
import { GlyphRectifier } from "../interface";
import { rectifyBaseTableGlyphs } from "../layout/base";
import { rectifyGdefGlyphs } from "../layout/gdef";
import { rectifyLayoutGlyphs } from "../layout/gsub-gpos";

function rectifyFontGlyphStore<GS extends Data.OrderStore<Ot.Glyph>>(
    rec: GlyphRectifier,
    font: Ot.Font<GS>,
    gsf: Data.OrderStoreFactory<Ot.Glyph, GS>
) {
    const gOrd = font.glyphs.decideOrder();
    const gList1: Ot.Glyph[] = [];
    for (const g of gOrd) {
        const g1 = rec.glyph(g);
        if (g1) gList1.push(g1);
    }

    const alg = new RectifyGeomGlyphAlg(rec);
    for (const g1 of gList1) {
        if (g1.geometry) {
            g1.geometry = g1.geometry.acceptGeometryAlgebra(alg);
        }
    }

    const glyphs1 = gsf.createStoreFromList(gList1);
    font.glyphs = glyphs1;
}

export function rectifyFontGlyphs<GS extends Data.OrderStore<Ot.Glyph>>(
    rec: GlyphRectifier,
    font: Ot.Font<GS>,
    gsf: Data.OrderStoreFactory<Ot.Glyph, GS>
) {
    rectifyFontGlyphStore(rec, font, gsf);
    if (Ot.Font.isCff(font)) inPlaceRectifyGlyphCffTable(rec, font.cff);
    if (font.cmap) font.cmap = rectifyGlyphCmap(rec, font.cmap);
    if (font.gdef) {
        font.gdef = rectifyGdefGlyphs(font.gdef, rec);
    }
    if (font.gsub) {
        font.gsub = rectifyLayoutGlyphs(font.gsub, Ot.Gsub.Table.create, rec);
    }
    if (font.gpos) {
        font.gpos = rectifyLayoutGlyphs(font.gpos, Ot.Gpos.Table.create, rec);
    }
    if (font.base) {
        font.base = rectifyBaseTableGlyphs(rec, font.base);
    }
}
