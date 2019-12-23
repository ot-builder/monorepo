import * as fs from "fs";
import { FontIo, Ot } from "ot-builder";
import * as path from "path";

const file = process.argv[2];
const fileOut = process.argv[3];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = {};

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");
