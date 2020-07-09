import * as Ot from "@ot-builder/ot";

import { GlyphReferenceRectifier } from "../interface";
import { RectifyImpl } from "../shared";

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

export function rectifyExtPrivate(rec: GlyphReferenceRectifier, table: Ot.XPrv.Table) {
    const newTable = new Ot.XPrv.Table();
    newTable.shared = table.shared;
    if (table.perGlyph) {
        newTable.perGlyph = RectifyImpl.Glyph.mapSome(rec, table.perGlyph);
    }
    return newTable;
}
