import { OtFont } from "@ot-builder/font";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

function traceGlyphsImpl<GS extends Data.OrderStore<OtGlyph>>(
    font: OtFont<GS>,
    tracer: OtGlyph.Tracer
) {
    const gOrd = font.glyphs.decideOrder();
    for (const g of gOrd) g.traceGlyphs(tracer);
    if (font.gdef) font.gdef.traceGlyphs(tracer);
    if (font.gsub) font.gsub.traceGlyphs(tracer);
    if (font.gpos) font.gpos.traceGlyphs(tracer);
}

export function traceGlyphs<GS extends Data.OrderStore<OtGlyph>>(
    font: OtFont<GS>,
    init: Iterable<OtGlyph>
) {
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
