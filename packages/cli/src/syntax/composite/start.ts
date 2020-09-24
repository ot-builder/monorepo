import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseState } from "../../argv-parser";
import { Grammar, Syntax } from "../../command";
import { packageVersion } from "../../package-version";

export class StartSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    public handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    public displayHelp(shower: CliHelpShower) {
        shower
            .message()
            .message('ot-builder CLI utility program "otb-cli",', "version", packageVersion)
            .message(Style.Rule)
            .message(`Usage :`);
        this.body.displayHelp(shower);
    }
}
