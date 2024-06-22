import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliProc, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
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
        shower.message(Style.Option`--merge`, `[`, Style.Option`--override`, `]`);
        shower
            .indent("")
            .message("Merge the font on the stack top to the font below it.")
            .message(
                `In a typical use like:`,
                Style.Cmd`otb-cli`,
                Style.Arg`a.ttf`,
                Style.Arg`b.ttf`,
                Style.Option`--merge`,
                Style.Option`-o`,
                Style.Arg`ab.ttf`,
                `, metadata and naming will follow`,
                Style.Arg`a.ttf`,
                `while glyphs from`,
                Style.Arg`b.ttf`,
                `will be added to it.`
            )
            .message(
                `When`,
                Style.Option`--override`,
                `is provided, characters from`,
                Style.Arg`b.ttf`,
                `will be preferred; otherwise, characters from`,
                Style.Arg`a.ttf`,
                `will be preferred.`
            );
    }
};
