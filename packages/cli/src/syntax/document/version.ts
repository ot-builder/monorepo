import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";
import { packageVersion } from "../../package-version";

export const VersionSyntax: Syntax<null | CliAction[]> = {
    handle: (st, sy) => {
        if (!st.isOption("--version", "-v")) return ParseResult(st, null);

        return ParseResult(st.next(), [
            async state => {
                console.log(packageVersion);
            }
        ]);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            Style.Cmd`otb-cli`,
            Style.Option`-v`,
            `;`,
            Style.Cmd`otb-cli`,
            Style.Option`--version`
        );
        shower.indent("").message("Display version of this utility.");
    }
};
