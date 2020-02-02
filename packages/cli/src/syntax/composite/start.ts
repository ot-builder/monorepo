import { ParseState } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { Grammar, Syntax } from "../../command";

export class StartSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    displayHelp(shower: CliHelpShower) {
        shower.message(`Usage :`);
        this.body.displayHelp(shower);
    }
}
