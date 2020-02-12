import * as Ot from "@ot-builder/font";

import { rectifyGlyphCmap } from "../encoding";
import { inPlaceRectifyGlyphCffTable } from "../glyph-store/cff";
import { RectifyGeomGlyphAlg } from "../glyph/glyph-alg";
import { GlyphReferenceRectifier } from "../interface";
import { rectifyBaseTableGlyphs } from "../layout/base";
import { rectifyGdefGlyphs } from "../layout/gdef";
import { rectifyGposGlyphs, rectifyGsubGlyphs } from "../layout/gsub-gpos";

function rectifyFontGlyphStore<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    const gOrd = font.glyphs.decideOrder();

    for (const g1 of gOrd) {
        if (g1.geometry) {
            g1.geometry = new RectifyGeomGlyphAlg(rec).process(g1.geometry);
        }
    }
}

export function rectifyFontGlyphReferences<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    rectifyFontGlyphStore(rec, font);
    if (Ot.Font.isCff(font)) {
        inPlaceRectifyGlyphCffTable(rec, font.cff);
    }
    if (font.cmap) {
        font.cmap = rectifyGlyphCmap(rec, font.cmap);
    }
    if (font.gdef) {
        font.gdef = rectifyGdefGlyphs(rec, font.gdef);
    }
    if (font.gsub) {
        font.gsub = rectifyGsubGlyphs(rec, font.gsub);
    }
    if (font.gpos) {
        font.gpos = rectifyGposGlyphs(rec, font.gpos);
    }
    if (font.base) {
        font.base = rectifyBaseTableGlyphs(rec, font.base);
    }
}
