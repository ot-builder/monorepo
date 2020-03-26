import * as Ot from "@ot-builder/ot";

import { GlyphReferenceRectifier } from "../interface";

export function rectifyGlyphCmap(rec: GlyphReferenceRectifier, table: Ot.Cmap.Table) {
    const newTable = new Ot.Cmap.Table();
    for (const [encoding, glyph] of table.unicode.entries()) {
        const g1 = rec.glyphRef(glyph);
        if (g1) newTable.unicode.set(encoding, g1);
    }
    for (const [u, s, glyph] of table.vs.entries()) {
        const g1 = rec.glyphRef(glyph);
        if (g1) newTable.vs.set(u, s, g1);
    }
    return newTable;
}
