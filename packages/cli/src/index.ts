import { StartParseArgv } from "./argv-parser";
import { createGrammar } from "./create-grammar";
import { CliState } from "./state";

export async function cliMain(argv: string[]) {
    const parse = StartParseArgv(argv, 2);
    const syntax = createGrammar();
    const prAction = syntax.start.handle(parse, syntax);
    if (!prAction.progress.isEof()) {
        console.error("! Unrecognizable argument/option. Stop.");
        console.error(prAction.progress.reportParseErrorPosition());
        process.exit(1);
    }
    if (prAction.result) {
        const state = new CliState();
        await prAction.result(state);
    }
}
