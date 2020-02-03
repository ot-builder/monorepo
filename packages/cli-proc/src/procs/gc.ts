import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { createSubsetRectifier } from "../support/initial-visible-glyphs";

export function gcFont<GS1 extends Ot.GlyphStore, GS2 extends Ot.GlyphStore>(
    font: Ot.Font<GS1>,
    gsf: Ot.GlyphStoreFactory<GS2>
) {
    const { glyphs, rectifier } = createSubsetRectifier(font, { has: () => true });

    const font1 = { ...font, glyphs: gsf.createStoreFromList(glyphs) };
    Rectify.rectifyFontGlyphReferences(rectifier, font1);
    return font1;
}
