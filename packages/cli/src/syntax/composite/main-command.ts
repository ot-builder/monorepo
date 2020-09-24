import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseState } from "../../argv-parser";
import { Grammar, Syntax } from "../../command";

export class MainCommandSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    public handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    public displayHelp(shower: CliHelpShower) {
        shower.message(Style.Cmd`otb-cli`, Style.Param`command 1`, Style.Param`command 2`, `...`);
        shower.indent().message(`Perform font operation in a stack-based manner.`);
        this.body.displayHelp(shower);
    }
}
