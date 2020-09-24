import { CliHelpShower } from "@ot-builder/cli-help-shower";

import { ParseResult, ParseState } from "../argv-parser";
import { CliState } from "../state";

export type CliAction = (state: CliState) => Promise<void>;
export interface Syntax<T> {
    handle(st: ParseState, grammar: Grammar): ParseResult<T>;
    displayHelp(shower: CliHelpShower): void;
}
export type Grammar = {
    start: Syntax<null | CliAction[]>;
    element: Syntax<null | CliAction>;
};
