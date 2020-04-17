import * as Fs from "fs-extra";
import { FontIo, Ot } from "ot-builder";

import { ArgParser } from "./arg-parser";
import { createTtc } from "./create-ttc";
import { SparseGlyphSharer } from "./sparse-sharer";

export async function cliMain(argv: string[]) {
    const args = new ArgParser();
    for (const arg of argv.slice(2)) args.arg(arg);

    if (args.displayHelp) {
        console.log(`otb-ttc-bundle [-u | --unify | -x | --sparse] [-o output] input1 input2 ...`);
        console.log(`  Bundles multiple TTF into one TTC with glyph sharing.`);
        console.log(`  Use -u / --unify to unify glyph set.`);
        console.log(`  Use -x / --sparse to enable sparse glyph sharing (TT outline only).`);
        return;
    }

    if (!args.unify && !args.sparse) {
        await simpleMerging(args);
    } else {
        await glyphSharingMerging(args);
    }
}

async function simpleMerging(args: ArgParser) {
    const sfntList: Ot.Sfnt[] = [];
    for (const input of args.inputs) {
        process.stderr.write(`Processing ${input}\n`);
        const bufFont = await Fs.readFile(input);
        sfntList.push(FontIo.readSfntOtf(bufFont));
    }
    if (args.output) {
        const bufTtc = FontIo.writeSfntTtc(sfntList);
        await Fs.writeFile(args.output, bufTtc);
    }
}

async function glyphSharingMerging(args: ArgParser) {
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
        const cfg = {
            glyphStore: { statOs2XAvgCharWidth: false },
            ttf: { gvarForceProduceGVD: args.sparse, gvarForceZeroGapsBetweenGVD: args.sparse }
        };
        for (const font of sharer.fonts) {
            resultBuffers.push(FontIo.writeSfntOtf(FontIo.writeFont(font, cfg)));
        }
        const bufTtc = createTtc(resultBuffers, sharing);
        await Fs.writeFile(args.output, bufTtc);
    }
}
