import * as Fs from "fs";
import * as Path from "path";
import { FontIo, Ot } from "ot-builder";
import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliOptionStyle, CliParamStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";

export const SaveHeadSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("+o", "++save")) return ParseResult(st, null);

        const prPath = st.nextArgument();
        return ParseResult(prPath.progress.next(), async state => {
            const entry = state.shift();
            if (!entry) throw new RangeError("Stack size invalid. No font to save.");
            console.log(`Save ${entry} -> ${prPath.result}`);
            await saveFontToFile(prPath.result, entry.font);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(
            CliOptionStyle`+o`,
            CliParamStyle`path`,
            `;`,
            CliOptionStyle`++save`,
            CliParamStyle`path`
        );
        shower
            .indent()
            .message(`Shift the stack bottom font and save into the`, CliParamStyle`path`, `.`)
            .message(`Currently only .otf and .ttf files are supported.`);
    }
};

export async function saveFontToFile<GS extends Ot.GlyphStore>(
    path: string,
    font: Ot.Font<GS>,
    cfg?: FontIo.FontIoConfig
) {
    const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
    Fs.writeFileSync(Path.resolve(path), buf1);
}
