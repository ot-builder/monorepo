import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { createSubsetRectifier } from "../support/initial-visible-glyphs";

export function gcFont<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    gsf: Ot.GlyphStoreFactory<GS>
) {
    const { glyphs, rectifier } = createSubsetRectifier(font, { has: () => true });
    font.glyphs = gsf.createStoreFromList(glyphs);
    Rectify.rectifyFontGlyphReferences(rectifier, font);
}
