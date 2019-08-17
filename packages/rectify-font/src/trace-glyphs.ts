import { OtFont } from "@ot-builder/font";
import { OtGlyph, OtGlyphStore } from "@ot-builder/ft-glyphs";

function traceGlyphsImpl<GS extends OtGlyphStore>(font: OtFont<GS>, tracer: OtGlyph.Tracer) {
    const gOrd = font.glyphs.decideOrder();
    for (const g of gOrd) g.traceGlyphs(tracer);
    if (font.gdef) font.gdef.traceGlyphs(tracer);
    if (font.gsub) font.gsub.traceGlyphs(tracer);
    if (font.gpos) font.gpos.traceGlyphs(tracer);
}

export function traceGlyphs<GS extends OtGlyphStore>(font: OtFont<GS>, init: Iterable<OtGlyph>) {
    const tracer = new Set<OtGlyph>(init);
    let sizeBefore = 0,
        sizeAfter = 0;
    do {
        sizeBefore = tracer.size;
        traceGlyphsImpl(font, tracer);
        sizeAfter = tracer.size;
    } while (sizeBefore < sizeAfter);
    return tracer;
}
