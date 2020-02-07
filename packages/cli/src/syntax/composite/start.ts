import { ParseState } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliRule } from "../../cli-help/style";
import { Grammar, Syntax } from "../../command";
import { packageVersion } from "../../package-version";

export class StartSyntax<T> implements Syntax<T> {
    constructor(private readonly body: Syntax<T>) {}
    handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    displayHelp(shower: CliHelpShower) {
        shower
            .message()
            .message('ot-builder CLI utility program "otb-cli",', "version", packageVersion)
            .message(CliRule)
            .message(`Usage :`);
        this.body.displayHelp(shower);
    }
}
