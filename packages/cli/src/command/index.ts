import type { CliHelpShower } from "@ot-builder/cli-help-shower";

import type { ParseResult, ParseState } from "../argv-parser";
import type { CliState } from "../state";

export type CliAction = (state: CliState) => Promise<void>;
export interface Syntax<T> {
    handle(st: ParseState, grammar: Grammar): ParseResult<T>;
    displayHelp(shower: CliHelpShower): void;
}
export type Grammar = {
    start: Syntax<null | CliAction>;
    element: Syntax<null | CliAction>;
};
