import { CliProc, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliArgStyle, CliCmdStyle, CliOptionStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";

export const MergeSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--merge")) return ParseResult(st, null);
        st = st.next();

        let preferOverride = false;
        if (st.isOption("--override")) {
            preferOverride = true;
            st = st.next();
        }

        return ParseResult(st, async state => {
            const add = state.pop();
            if (!add) throw new RangeError("Stack size invalid. No font to do GC.");
            const into = state.pop();
            if (!into) throw new RangeError("Stack size invalid. No font to do GC.");

            console.log(`Merge font ${into} <- ${add}`);
            CliProc.mergeFonts(into.font, add.font, Ot.ListGlyphStoreFactory, { preferOverride });
            state.push(into.fill(into.font));
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliOptionStyle`--merge`, `[`, CliOptionStyle`--override`, `]`);
        shower
            .indent("")
            .message("Merge the font on the stack top to the font below it.")
            .message(
                `In a typical use like:`,
                CliCmdStyle`otb-cli`,
                CliArgStyle`a.ttf`,
                CliArgStyle`b.ttf`,
                CliOptionStyle`--merge`,
                CliOptionStyle`-o`,
                CliArgStyle`ab.ttf`,
                `, metadata and naming will follow`,
                CliArgStyle`a.ttf`,
                `while glyphs from`,
                CliArgStyle`b.ttf`,
                `will be added to it.`
            )
            .message(
                `When`,
                CliOptionStyle(`--override`),
                `is provided, characters from`,
                CliArgStyle`b.ttf`,
                `will be preferred; otherwise, characters from`,
                CliArgStyle`a.ttf`,
                `will be preferred.`
            );
    }
};
