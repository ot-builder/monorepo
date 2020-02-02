import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliCmdStyle, CliOptionStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";
import { createSubsetRectifier } from "../../support/initial-visible-glyphs";

export const HelpSyntax: Syntax<null | CliAction[]> = {
    handle: (st, sy) => {
        if (!st.isOption("--help", "-h")) return ParseResult(st, null);

        const shower = new CliHelpShower();
        sy.start.displayHelp(shower);

        return ParseResult(st.next(), []);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            CliCmdStyle`otb-cli`,
            CliOptionStyle`-h`,
            `;`,
            CliCmdStyle`otb-cli`,
            CliOptionStyle`--help`
        );
        shower.indent("").message("Display help message.");
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
