import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { ParseResult } from "../argv-parser";
import { CliAction, Syntax } from "../command";
import { createSubsetRectifier } from "../support/initial-visible-glyphs";

export const SubsetSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--subset")) return ParseResult(st, null);

        const prArg = st.nextArgument();
        return ParseResult(prArg.progress.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to subset.");
            console.log(`Subset ${entry}`);
            const gcBefore = entry.font.glyphs.decideOrder().length;
            const gcResult = subsetFont(entry.font, prArg.result, Ot.ListGlyphStoreFactory);
            const gcAfter = gcResult.glyphs.decideOrder().length;

            state.push(entry.fill(gcResult));
            console.log(`  Glyphs: ${gcAfter} / ${gcBefore}`);
        });
    }
};

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
