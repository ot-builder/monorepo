import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const HelpSyntax: Syntax<null | CliAction[]> = {
    handle: (st, sy) => {
        if (!st.isOption("--help", "-h")) return ParseResult(st, null);

        return ParseResult(st.next(), [
            async () => {
                const shower = new CliHelpShower();
                sy.start.displayHelp(shower);
            }
        ]);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            Style.Cmd`otb-cli`,
            Style.Option`-h`,
            `;`,
            Style.Cmd`otb-cli`,
            Style.Option`--help`
        );
        shower.indent("").message("Display help message.");
    }
};
