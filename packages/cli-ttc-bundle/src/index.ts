import * as Fs from "fs";

import { inferSaveCfg } from "@ot-builder/cli-shared";
import { CliProc, FontIo, Ot } from "ot-builder";

import { ArgParser, displayHelp, displayVersion } from "./arg-parser";
import { createTtcSlices } from "./glyph-sharing/create-ttc";
import { SparseGlyphSharer } from "./glyph-sharing/sparse-sharer";

export async function cliMain(argv: string[]) {
    const args = new ArgParser();
    for (const arg of argv.slice(2)) args.arg(arg);

    if (args.displayHelp) return displayHelp();
    if (args.displayVersion) return displayVersion();

    if (!args.inputs || !args.inputs.length) {
        throw new Error("Please specify at least one input font. Exit.");
    }
    if (!args.output) {
        throw new Error("Please specify an output. Exit");
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
        if (args.verbose) process.stderr.write(`Processing ${input}\n`);
        const bufFont = await Fs.promises.readFile(input);
        if (bufFont.readUInt32BE(0) === tagToUInt32("ttcf")) {
            const ttc = FontIo.readSfntTtc(bufFont);
            for (const sub of ttc) sfntList.push(sub);
        } else {
            sfntList.push(FontIo.readSfntOtf(bufFont));
        }
    }
    if (args.verbose) process.stderr.write(`${sfntList.length} sub-fonts found.\n`);
    if (args.output) {
        const bufTtc = FontIo.writeSfntTtc(sfntList);
        await Fs.promises.writeFile(args.output, bufTtc);
    }
}

async function glyphSharingMerging(args: ArgParser) {
    const gsf = Ot.ListGlyphStoreFactory;
    const sharer = new SparseGlyphSharer(gsf);
    for (const input of args.inputs) {
        if (args.verbose) process.stderr.write(`Processing ${input}\n`);
        const bufFont = await Fs.promises.readFile(input);
        if (bufFont.readUInt32BE(0) === tagToUInt32("ttcf")) {
            const ttc = FontIo.readSfntTtc(bufFont);
            for (const sub of ttc) {
                const subFont = FontIo.readFont(sub, gsf);
                sharer.addFont(subFont);
            }
        } else {
            const subFont = FontIo.readFont(FontIo.readSfntOtf(bufFont), gsf);
            sharer.addFont(subFont);
        }
    }
    if (args.verbose) process.stderr.write(`${sharer.fonts.length} sub-fonts found.\n`);

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
        for (const [iFont, font] of sharer.fonts.entries()) {
            const fur = sharer.fontUnificationResults[iFont];
            if (!args.sparse) renameGlyphs(iFont, font, fur);
            const cfg: FontIo.FontIoConfig = inferSaveCfg(args, font);
            cfg.ttf = {
                ...cfg.ttf,
                gvarForceProduceGVD: args.sparse,
                gvarForceZeroGapsBetweenGVD: args.sparse
            };
            resultBuffers.push(FontIo.writeSfntOtf(FontIo.writeFont(font, cfg)));
        }
        const slices = createTtcSlices(resultBuffers, sharing);
        await Fs.promises.writeFile(args.output, FontIo.writeSfntTtcFromTableSlices(slices));
    }
}

function renameGlyphs(iFont: number, font: Ot.Font, ur: CliProc.GlyphUnificationResults) {
    const gOrd = font.glyphs.decideOrder();
    const conflictSet = new Set<string>();
    // Delete all glyph names
    for (const [gid, g] of gOrd.entries()) g.name = undefined;
    // Populate "proper" names
    for (const [gid, g] of gOrd.entries()) {
        if (!gid) {
            nameGlyphWithoutConflict(g, ".notdef", conflictSet);
        } else {
            const urName = ur.originalNames.get(g);
            if (urName) nameGlyphWithoutConflict(g, urName, conflictSet);
        }
    }
    // Populate name for unused glyphs
    for (const [gid, g] of gOrd.entries()) {
        if (g.name) continue;
        nameGlyphWithoutConflict(g, `.unused${gid}`, conflictSet);
    }
}

function nameGlyphWithoutConflict(g: Ot.Glyph, desired: string, conflictSet: Set<string>) {
    if (!conflictSet.has(desired)) {
        g.name = desired;
        conflictSet.add(desired);
        return;
    }

    for (let n = 2; ; n++) {
        const nameT = desired + "." + n;
        if (!conflictSet.has(nameT)) {
            g.name = nameT;
            conflictSet.add(nameT);
            return;
        }
    }
}

function tagToUInt32(x: string) {
    return (
        (x.charCodeAt(0) & 0xff) * 256 * 256 * 256 +
        (x.charCodeAt(1) & 0xff) * 256 * 256 +
        (x.charCodeAt(2) & 0xff) * 256 +
        (x.charCodeAt(3) & 0xff)
    );
}
