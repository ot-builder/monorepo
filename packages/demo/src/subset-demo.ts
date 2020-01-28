import * as fs from "fs";
import * as path from "path";
import { FontIo, Ot, Rectify } from "ot-builder";

const file = process.argv[2];
const subsetText = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = {} as FontIo.FontIoConfig;

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

const { glyphs, rectifier } = createSubsetRectifier(font, subsetText);
font.glyphs = Ot.ListGlyphStoreFactory.createStoreFromList(glyphs);
Rectify.rectifyFontGlyphReferences(rectifier, font);

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createSubsetRectifier<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    text: string
): { glyphs: Ot.Glyph[]; rectifier: Rectify.GlyphReferenceRectifier } {
    const codePointFilter =
        text === "*" ? { has: () => true } : new Set([...text].map(s => s.codePointAt(0)!));
    const init = Rectify.visibleGlyphsFromUnicodeSet(font, codePointFilter);
    const collected = Rectify.traceGlyphs(new Set(init), font);
    return {
        glyphs: Array.from(font.glyphs.decideOrder()).filter(x => collected.has(x)),
        rectifier: {
            glyphRef(g: Ot.Glyph) {
                if (collected.has(g)) return g;
                else return undefined;
            }
        }
    };
}
