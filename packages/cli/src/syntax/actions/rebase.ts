import { CliProc } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliOptionStyle, CliParamStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";

export const RebaseSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--rebase")) return ParseResult(st, null);

        const prArg = st.nextArgument();
        return ParseResult(prArg.progress.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to rebase.");
            const newUpm = parseFloat(prArg.result) || entry.font.head.unitsPerEm;
            console.log(`Rebase ${entry} to ${newUpm}`);
            CliProc.rebaseFont(entry.font, newUpm);
            state.push(entry);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliOptionStyle`--rebase`, CliParamStyle`upm`);
        shower.indent("").message("Change the unit-per-em value of the font at the stack top.");
    }
};
