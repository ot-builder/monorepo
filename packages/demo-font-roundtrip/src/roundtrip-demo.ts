import * as fs from "fs";
import { Ot } from "ot-builder";
import * as Ob from "ot-builder";
import * as path from "path";

const file = process.argv[2];
const fileOut = process.argv[3];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Ob.Config.create<Ob.FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = Ob.readFont(Ob.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = Ob.writeSfntOtf(Ob.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");
