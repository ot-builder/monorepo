import * as Fs from "fs";
import * as Path from "path";
import * as Ot from "@ot-builder/font";
import * as FontIo from "@ot-builder/io-bin-font";
import { ParseResult } from "../argv-parser";
import { CliAction, Syntax } from "../command";
import { CliStackEntryPlaceholder } from "../state";

export const IntroSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isArgument()) return ParseResult(st, null);

        const path = st.argument;
        return ParseResult(st.next(), async state => {
            const phEntry = new CliStackEntryPlaceholder(Path.parse(path).name);
            console.log(`Load ${phEntry} <- ${path}`);
            const entry = phEntry.fill(await loadFontFromFile(path, Ot.ListGlyphStoreFactory));
            state.push(entry);
        });
    }
};

export async function loadFontFromFile<GS extends Ot.GlyphStore>(
    path: string,
    gsf: Ot.GlyphStoreFactoryWithDefault<GS>,
    cfg?: FontIo.FontIoConfig
) {
    const bufFont = Fs.readFileSync(Path.resolve(path));
    return FontIo.readFont(FontIo.readSfntOtf(bufFont), gsf, cfg);
}
