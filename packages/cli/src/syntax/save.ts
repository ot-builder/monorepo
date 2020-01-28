import * as Fs from "fs";
import * as Path from "path";
import * as Ot from "@ot-builder/font";
import * as FontIo from "@ot-builder/io-bin-font";
import { ParseResult } from "../argv-parser";
import { Syntax, CliAction } from "../command";

export const SaveSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("-o", "--save")) return ParseResult(st, null);

        const prPath = st.nextArgument();
        return ParseResult(prPath.progress.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to save.");
            console.log(`Save ${entry} -> ${prPath.result}`);
            await saveFontToFile(prPath.result, entry.font);
        });
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
