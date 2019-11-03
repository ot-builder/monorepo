import * as fs from "fs";
import { Ot } from "ot-builder";
import * as Ob from "ot-builder";
import * as path from "path";

const file = process.argv[2];
const subsetText = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Ob.Config.create<Ob.FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = Ob.readFont(Ob.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

const rectifier = createSubsetRectifier(font, subsetText);
Ob.rectifyFontGlyphs(rectifier, font, Ot.ListGlyphStoreFactory);

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = Ob.writeSfntOtf(Ob.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createSubsetRectifier<GS extends Ob.Data.OrderStore<Ot.Glyph>>(
    font: Ot.Font<GS>,
    text: string
) {
    const init: Set<Ot.Glyph> = new Set();
    const gOrd = font.glyphs.decideOrder();
    init.add(gOrd.at(0)); // keep NOTDEF

    const codePoints = [...text].map(s => s.codePointAt(0)!);
    if (font.cmap) {
        for (const code of codePoints) {
            const g = font.cmap.unicode.get(code);
            if (g) init.add(g);
        }
    }
    const collected = Ob.traceGlyphs(font, init);
    const rect: Ob.Rectify.Glyph.RectifierT<Ot.Glyph> = {
        glyph(g: Ot.Glyph) {
            if (collected.has(g)) return g;
            else return undefined;
        }
    };
    return rect;
}
