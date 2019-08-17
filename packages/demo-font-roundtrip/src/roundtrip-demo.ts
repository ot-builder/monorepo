import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { FontIoConfig, readFont, writeFont } from "@ot-builder/io-bin-font";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import * as fs from "fs";
import * as path from "path";

const file = process.argv[2];
const fileOut = process.argv[3];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Config.create<FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const sfnt = new BinaryView(bufFont).next(SfntOtf);
const font = readFont(sfnt, OtListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const sfnt1 = writeFont(font, cfg);
const buf1 = Frag.packFrom(SfntOtf, sfnt1);
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");
