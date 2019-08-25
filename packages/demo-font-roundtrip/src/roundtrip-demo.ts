import { Config } from "@ot-builder/cfg-log";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import {
    FontIoConfig,
    readFont,
    readSfntOtf,
    writeFont,
    writeSfntOtf
} from "@ot-builder/io-bin-font";
import * as fs from "fs";
import * as path from "path";

const file = process.argv[2];
const fileOut = process.argv[3];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Config.create<FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = readFont(readSfntOtf(bufFont), OtListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = writeSfntOtf(writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");
