import { ParseState } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliCmdStyle, CliParamStyle } from "../../cli-help/style";
import { Grammar, Syntax } from "../../command";

export class MainCommandSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    public handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    public displayHelp(shower: CliHelpShower) {
        shower.message(
            CliCmdStyle`otb-cli`,
            CliParamStyle`command 1`,
            CliParamStyle`command 2`,
            `...`
        );
        shower.indent().message(`Perform font operation in a stack-based manner.`);
        this.body.displayHelp(shower);
    }
}
