import { CliProc, Ot } from "ot-builder";
import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliOptionStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";

export const ShareGlyphSetSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--share-glyph-set")) return ParseResult(st, null);

        return ParseResult(st.next(), async state => {
            const entries = state.popAll();
            console.log(
                "Share glyph set among",
                entries.map(e => e.identifier)
            );
            if (entries.length) {
                let totalGlyphs = 0;
                for (const entry of entries) {
                    totalGlyphs += entry.font.glyphs.decideOrder().length;
                }
                const fonts = entries.map(e => e.font);
                CliProc.shareGlyphSet(fonts, Ot.ListGlyphStoreFactory);
                const uniqueGlyphs = fonts[0].glyphs.decideOrder().length;
                console.log(
                    `  ${uniqueGlyphs} unique glyphs concluded from ${totalGlyphs} glyphs.`
                );
            }
            for (const entry of entries) {
                state.push(entry);
            }
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliOptionStyle`--share-glyph-set`);
        shower
            .indent("")
            .message(
                "Share glyph set of every fonts in the stack.",
                "Usually used to create TTC files."
            );
    }
};
