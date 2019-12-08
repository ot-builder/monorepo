import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyGlyphCmap(rec: Rectify.Glyph.RectifierT<Ot.Glyph>, table: Ot.Cmap.Table) {
    const newTable = new Ot.Cmap.Table();
    for (const [encoding, glyph] of table.unicode.entries()) {
        const g1 = rec.glyph(glyph);
        if (g1) newTable.unicode.set(encoding, g1);
    }
    for (const [u, s, glyph] of table.vs.entries()) {
        const g1 = rec.glyph(glyph);
        if (g1) newTable.vs.set(u, s, g1);
    }
    return newTable;
}
