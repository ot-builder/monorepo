import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { inferSaveCfg } from "@ot-builder/cli-shared";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

import { saveFontToFile } from "./save";

export const SaveHeadSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("+o", "++save")) return ParseResult(st, null);
        st = st.next();

        const path = st.expectArgument();
        return ParseResult(st.next(), async state => {
            const entry = state.shift();
            if (!entry) throw new RangeError("Stack size invalid. No font to save.");
            console.log(`Save ${entry} -> ${path}`);
            await saveFontToFile(path, entry.font, inferSaveCfg(state, entry.font));
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            Style.Option`+o`,
            Style.Param`path`,
            `;`,
            Style.Option`++save`,
            Style.Param`path`
        );
        shower
            .indent()
            .message(`Shift the stack bottom font and save into the`, Style.Param`path`, `.`)
            .message(`Currently only .otf and .ttf files are supported.`);
    }
};
