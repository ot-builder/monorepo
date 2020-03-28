import * as Ot from "@ot-builder/ot";

import {
    GlyphReferenceRectifier,
    IdAxisRectifier,
    IdCoordRectifier,
    IdPointAttachmentRectifier
} from "../interface";

import { rectifyFont } from "./rectify-font";

export function rectifyFontGlyphReferences<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(rec, IdAxisRectifier, IdCoordRectifier, IdPointAttachmentRectifier, font);
}
