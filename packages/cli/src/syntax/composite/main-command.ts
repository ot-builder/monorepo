import { ParseState } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { Grammar, Syntax } from "../../command";

export class MainCommandSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    displayHelp(shower: CliHelpShower) {
        shower.message(`otb-cli <command 1> <command 2> ...`);
        shower.indent().message(`Perform font operation in a stack-based manner.`);
        this.body.displayHelp(shower);
    }
}
