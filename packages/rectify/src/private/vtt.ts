import * as Ot from "@ot-builder/ot";

import { GlyphReferenceRectifier } from "../interface";
import { RectifyImpl } from "../shared";

// We do not implement rectifier for TSIC since it uses a different variation model

export function rectifyTSI0123Table(rg: GlyphReferenceRectifier, table: Ot.TSI0123.Table) {
    const t1 = new Ot.TSI0123.Table();
    t1.glyphPrograms = RectifyImpl.Glyph.mapSome(rg, table.glyphPrograms);
    t1.preProgram = table.preProgram;
    t1.cvtProgram = table.cvtProgram;
    t1.fpgmProgram = table.fpgmProgram;
    return t1;
}

export function rectifyTSI5Table(rg: GlyphReferenceRectifier, table: Ot.TSI5.Table) {
    const t1 = new Ot.TSI5.Table();
    t1.charGroupFlags = RectifyImpl.Glyph.mapSome(rg, table.charGroupFlags);
    return t1;
}
