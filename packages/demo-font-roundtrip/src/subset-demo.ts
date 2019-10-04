import { Config } from "@ot-builder/cfg-log";
import { OtFont } from "@ot-builder/font";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import {
    FontIoConfig,
    readFont,
    readSfntOtf,
    writeFont,
    writeSfntOtf
} from "@ot-builder/io-bin-font";
import { Data } from "@ot-builder/prelude";
import { Rectify } from "@ot-builder/prelude";
import { rectifyFontGlyphs, traceGlyphs } from "@ot-builder/rectify-font";
import * as fs from "fs";
import * as path from "path";

const file = process.argv[2];
const subsetText = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Config.create<FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = readFont(readSfntOtf(bufFont), OtListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

const rectifier = createSubsetRectifier(font, subsetText);
rectifyFontGlyphs(rectifier, font, OtListGlyphStoreFactory);

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = writeSfntOtf(writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createSubsetRectifier<GS extends Data.OrderStore<OtGlyph>>(
    font: OtFont<GS>,
    text: string
) {
    const init: Set<OtGlyph> = new Set();
    const gOrd = font.glyphs.decideOrder();
    init.add(gOrd.at(0)); // keep NOTDEF

    const codePoints = [...text].map(s => s.codePointAt(0)!);
    if (font.cmap) {
        for (const code of codePoints) {
            const g = font.cmap.unicode.get(code);
            if (g) init.add(g);
        }
    }
    const collected = traceGlyphs(font, init);
    const rect: Rectify.Glyph.RectifierT<OtGlyph> = {
        glyph(g: OtGlyph) {
            if (collected.has(g)) return g;
            else return undefined;
        }
    };
    return rect;
}
