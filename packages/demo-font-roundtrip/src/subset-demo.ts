import * as fs from "fs";
import { Data, FontIo, Ot, Rectify } from "ot-builder";
import * as path from "path";

const file = process.argv[2];
const subsetText = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = <FontIo.FontIoConfig>{};

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

const rectifier = createSubsetRectifier(font, subsetText);
Rectify.rectifyFontGlyphs(rectifier, font, Ot.ListGlyphStoreFactory);

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createSubsetRectifier<GS extends Data.OrderStore<Ot.Glyph>>(
    font: Ot.Font<GS>,
    text: string
): Rectify.GlyphRectifier {
    const codePointFilter =
        text === "*" ? { has: () => true } : new Set([...text].map(s => s.codePointAt(0)!));
    const init = Rectify.visibleGlyphsFromUnicodeSet(font, codePointFilter);
    const collected = Rectify.traceGlyphs(font, init);
    return {
        glyph(g: Ot.Glyph) {
            if (collected.has(g)) return g;
            else return undefined;
        }
    };
}
