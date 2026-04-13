import { type CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import type { ParseState } from "../../argv-parser";
import type { Grammar, Syntax } from "../../command";

export class StartSyntax<T> implements Syntax<T> {
    public constructor(
        private readonly appVersion: string,
        private readonly body: Syntax<T>
    ) {}
    public handle(st0: ParseState, grammar: Grammar) {
        return this.body.handle(st0, grammar);
    }
    public displayHelp(shower: CliHelpShower) {
        shower
            .message()
            .message('ot-builder CLI utility program "otb-cli",', "version", this.appVersion)
            .message(Style.Rule)
            .message(`Usage :`);
        this.body.displayHelp(shower);
    }
}
