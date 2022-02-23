import * as Fs from "fs";
import * as Path from "path";

import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { inferSaveCfg } from "@ot-builder/cli-shared";
import { FontIo, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const SaveSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("-o", "--save")) return ParseResult(st, null);
        st = st.next();

        const path = st.expectArgument();
        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to save.");
            console.log(`Save ${entry} -> ${path}`);
            await saveFontToFile(path, entry.font, inferSaveCfg(state, entry.font));
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            Style.Option`-o`,
            Style.Param`path`,
            `;`,
            Style.Option`--save`,
            Style.Param`path`
        );
        shower
            .indent()
            .message(`Pop the stack top font and save into the`, Style.Param`path`, `.`)
            .message(`Currently only .otf and .ttf files are supported.`);
    }
};

export async function saveFontToFile<GS extends Ot.GlyphStore>(
    path: string,
    font: Ot.Font<GS>,
    cfg: FontIo.FontIoConfig
) {
    const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
    await Fs.promises.writeFile(Path.resolve(path), buf1);
}
