import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliCmdStyle, CliOptionStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";
import { packageVersion } from "../../package-version";

export const VersionSyntax: Syntax<null | CliAction[]> = {
    handle: (st, sy) => {
        if (!st.isOption("--version")) return ParseResult(st, null);

        return ParseResult(st.next(), [
            async state => {
                console.log(packageVersion);
            }
        ]);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliCmdStyle`otb-cli`, CliOptionStyle`--version`);
        shower.indent("").message("Display version of this utility.");
    }
};
