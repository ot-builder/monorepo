import * as Fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { ArgParser } from "./arg-parser";
import { createTtc } from "./create-ttc";
import { SparseGlyphSharer } from "./sparse-sharing";

export async function cliMain(argv: string[]) {
    const args = new ArgParser();
    for (const arg of argv.slice(2)) args.arg(arg);

    if (args.displayHelp) {
        console.log(`otb-ttc-bundle [-x | --sparse] [-o output] input1 input2 ...`);
        console.log(`  Bundles multiple TTF into one TTC with glyph sharing.`);
        console.log(`  Use -x / --sparse option to enable sparse mode.`);
        return;
    }

    const gsf = Ot.ListGlyphStoreFactory;
    const sharer = new SparseGlyphSharer(gsf);
    for (const input of args.inputs) {
        process.stderr.write(`Processing ${input}\n`);
        const bufFont = await Fs.readFile(input);
        sharer.addFont(FontIo.readFont(FontIo.readSfntOtf(bufFont), gsf));
    }

    let sharing: null | number[][] = null;
    if (args.sparse) {
        sharing = sharer.sparseSharing(
            sharer.fonts[0].head.unitsPerEm,
            sharer.fonts[0].head.unitsPerEm
        );
    } else {
        sharer.unifyGlyphList();
    }

    if (args.output) {
        const resultBuffers: Buffer[] = [];
        const cfg = { glyphStore: { statOs2XAvgCharWidth: false } };
        for (const font of sharer.fonts) {
            resultBuffers.push(FontIo.writeSfntOtf(FontIo.writeFont(font, cfg)));
        }
        const bufTtc = createTtc(resultBuffers, sharing);
        await Fs.writeFile(args.output, bufTtc);
    }
}
