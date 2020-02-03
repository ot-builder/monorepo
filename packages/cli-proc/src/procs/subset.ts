import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { createSubsetRectifier } from "../support/initial-visible-glyphs";

export function subsetFont<GS1 extends Ot.GlyphStore, GS2 extends Ot.GlyphStore>(
    font: Ot.Font<GS1>,
    text: string,
    gsf: Ot.GlyphStoreFactory<GS2>
) {
    const { glyphs, rectifier } = createSubsetRectifier(
        font,
        new Set([...text].map(s => s.codePointAt(0)!))
    );

    const font1 = { ...font, glyphs: gsf.createStoreFromList(glyphs) };
    Rectify.rectifyFontGlyphReferences(rectifier, font1);
    return font1;
}
