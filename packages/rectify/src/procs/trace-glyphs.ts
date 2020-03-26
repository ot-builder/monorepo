import * as Ot from "@ot-builder/ot";

import { traceGlyphDependents } from "../glyph/trace-alg";
import { GlyphTracer } from "../interface";
import { traceGpos, traceGsub } from "../layout/gsub-gpos/trace";

function traceGlyphsImpl<GS extends Ot.GlyphStore>(font: Ot.Font<GS>, tracer: GlyphTracer) {
    const gOrd = font.glyphs.decideOrder();
    for (const g of gOrd) traceGlyphDependents(g)(tracer);
    if (font.gsub) traceGsub(font.gsub)(tracer);
    if (font.gpos) traceGpos(font.gpos)(tracer);
}

export function traceGlyphs<GS extends Ot.GlyphStore>(tracer: GlyphTracer, font: Ot.Font<GS>) {
    let sizeBefore = 0,
        sizeAfter = 0;
    do {
        sizeBefore = tracer.size;
        traceGlyphsImpl(font, tracer);
        sizeAfter = tracer.size;
    } while (sizeBefore < sizeAfter);
    return tracer;
}

export function visibleGlyphsFromUnicodeSet<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    unicodeSet: { has(u: number): boolean }
) {
    const gOrd = font.glyphs.decideOrder();
    const init: Set<Ot.Glyph> = new Set();
    init.add(gOrd.at(0)); // keep NOTDEF
    if (font.cmap) {
        for (const [u, glyph] of font.cmap.unicode.entries()) {
            if (unicodeSet.has(u)) init.add(glyph);
        }
        for (const [u, s, glyph] of font.cmap.vs.entries()) {
            if (unicodeSet.has(u)) init.add(glyph);
            if (unicodeSet.has(s)) init.add(glyph);
        }
    }
    return init;
}
