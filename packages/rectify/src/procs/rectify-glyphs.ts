import type * as Ot from "@ot-builder/ot";

import {
    type GlyphReferenceRectifier,
    IdAxisRectifier,
    IdCoordRectifier,
    IdPointAttachmentRectifier,
} from "../interface";

import { inPlaceRectifyFont } from "./rectify-font";

export function inPlaceRectifyFontGlyphReferences<GS extends Ot.GlyphStore>(
    rec: GlyphReferenceRectifier,
    font: Ot.Font<GS>,
) {
    return inPlaceRectifyFont(
        rec,
        IdAxisRectifier,
        IdCoordRectifier,
        IdPointAttachmentRectifier,
        font,
    );
}
