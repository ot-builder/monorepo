import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliOptionStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";
import { createSubsetRectifier } from "../../support/initial-visible-glyphs";

export const GcSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--gc")) return ParseResult(st, null);

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to do GC.");
            console.log(`Garbage collect ${entry}`);

            const gcBefore = entry.font.glyphs.decideOrder().length;
            const gcResult = gcFont(entry.font, Ot.ListGlyphStoreFactory);
            const gcAfter = gcResult.glyphs.decideOrder().length;

            state.push(entry.fill(gcResult));
            console.log(`  Glyphs: ${gcAfter} / ${gcBefore}`);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliOptionStyle`--gc`);
        shower.indent("").message("Perform garbage collection of the font at the stack top.");
    }
};

export function gcFont<GS1 extends Ot.GlyphStore, GS2 extends Ot.GlyphStore>(
    font: Ot.Font<GS1>,
    gsf: Ot.GlyphStoreFactory<GS2>
) {
    const { glyphs, rectifier } = createSubsetRectifier(font, { has: () => true });

    const font1 = { ...font, glyphs: gsf.createStoreFromList(glyphs) };
    Rectify.rectifyFontGlyphReferences(rectifier, font1);
    return font1;
}
