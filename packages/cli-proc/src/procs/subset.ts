import * as Ot from "@ot-builder/ot";
import * as Rectify from "@ot-builder/rectify";

import { createSubsetRectifier } from "../support/initial-visible-glyphs";

export function subsetFont<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    text: Iterable<string>,
    gsf: Ot.GlyphStoreFactory<GS>
) {
    const { glyphs, rectifier } = createSubsetRectifier(
        font,
        new Set([...text].map(s => s.codePointAt(0)!))
    );
    font.glyphs = gsf.createStoreFromList(glyphs);
    Rectify.rectifyFontGlyphReferences(rectifier, font);
}
