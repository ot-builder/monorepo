import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { OptimizationLevel } from "@ot-builder/cli-shared";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const SetOptimizationLevelSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (st.isOption("--optimize-none", "-O0")) {
            return ParseResult(st.next(), async state => {
                state.optimizationLevel = OptimizationLevel.None;
            });
        }
        if (st.isOption("--optimize-speed", "-Op")) {
            return ParseResult(st.next(), async state => {
                state.optimizationLevel = OptimizationLevel.Speed;
            });
        }
        if (st.isOption("--optimize-size", "-Oz")) {
            return ParseResult(st.next(), async state => {
                state.optimizationLevel = OptimizationLevel.Size;
            });
        }

        return ParseResult(st, null);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`-O0`, `;`, Style.Option`--optimize-none`);
        shower
            .indent("")
            .message(Style.Option`-Op`, `;`, Style.Option`--optimize-speed`)
            .message(Style.Option`-Oz`, `;`, Style.Option`--optimize-size`)
            .message("Set optimization level when outputting fonts:");
        shower
            .indent(Style.Bullet)
            .message(Style.Option`-O0`, "No special optimization is performed.")
            .message(Style.Option`-Op`, "Optimize the data arrangement for faster layout.")
            .message(Style.Option`-Oz`, "Optimize the data arrangement for smaller file size.");
    }
};
