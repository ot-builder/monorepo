import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliProc } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const ConsolidateSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--consolidate")) return ParseResult(st, null);

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to do consolidate.");

            console.log(`Consolidate ${entry}`);
            CliProc.consolidateFont(entry.font);
            state.push(entry);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`--consolidate`);
        shower.indent("").message("Perform consolidation of the font at the stack top.");
    }
};
