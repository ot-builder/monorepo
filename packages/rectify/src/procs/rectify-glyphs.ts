import * as Ot from "@ot-builder/ot";

import { GlyphReferenceRectifier, IdRectifier } from "../interface";

import { rectifyFont } from "./rectify-font";

export function rectifyFontGlyphReferences<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(rec, IdRectifier, IdRectifier, IdRectifier, font);
}
