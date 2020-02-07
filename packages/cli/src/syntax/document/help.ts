import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliCmdStyle, CliOptionStyle } from "../../cli-help/style";
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
            CliCmdStyle`otb-cli`,
            CliOptionStyle`-h`,
            `;`,
            CliCmdStyle`otb-cli`,
            CliOptionStyle`--help`
        );
        shower.indent("").message("Display help message.");
    }
};
