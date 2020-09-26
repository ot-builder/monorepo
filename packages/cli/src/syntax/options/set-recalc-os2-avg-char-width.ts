import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const SetRecalcOs2AvgCharWidthSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (st.isOption("++recalc-os2-avg-char-width")) {
            return ParseResult(st.next(), async state => {
                state.recalcOs2XAvgCharWidth = true;
            });
        }
        if (st.isOption("--recalc-os2-avg-char-width")) {
            return ParseResult(st.next(), async state => {
                state.recalcOs2XAvgCharWidth = false;
            });
        }
        return ParseResult(st, null);
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            Style.Option`++recalc-os2-avg-char-width`,
            `;`,
            Style.Option`--recalc-os2-avg-char-width`
        );
        shower
            .indent("")
            .message(
                `Set whether to recalculate the`,
                Style.Arg`xAvgCharWidth`,
                `field in the OS/2 table: Use`,
                Style.Option`--recalc-os2-avg-char-width`,
                `to disable,`,
                Style.Option`++recalc-os2-avg-char-width`,
                `to enable. By default recalculation is enabled.`
            );
    }
};
