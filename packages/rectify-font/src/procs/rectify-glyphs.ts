import * as Ot from "@ot-builder/font";

import { GlyphReferenceRectifier, IdRectifier } from "../interface";

import { rectifyFont } from "./rectify-font";

function rectifyFontGlyphStore<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(rec, IdRectifier, IdRectifier, IdRectifier, font);
}
