import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliProc, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const GcSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--gc")) return ParseResult(st, null);

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to do GC.");
            console.log(`Garbage collect ${entry}`);

            const gcBefore = entry.font.glyphs.decideOrder().length;
            CliProc.gcFont(entry.font, Ot.ListGlyphStoreFactory);
            const gcAfter = entry.font.glyphs.decideOrder().length;

            state.push(entry);
            console.log(`  Glyphs: ${gcAfter} / ${gcBefore}`);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`--gc`);
        shower.indent("").message("Perform garbage collection of the font at the stack top.");
    }
};
