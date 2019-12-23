import * as fs from "fs";
import { FontIo, Ot } from "ot-builder";
import * as path from "path";

import { FontProcessor } from "./font-processor";

const inputs: string[] = [];
const outputs: string[] = [];
for (let id = 2; id < process.argv.length; ) {
    inputs.push(process.argv[id++]);
    outputs.push(process.argv[id++]);
}

const cfg = {};

const fp = new FontProcessor();

for (let id = 0; id < inputs.length; id++) {
    console.log(`Read font ${inputs[id]}`);
    const bufFont = fs.readFileSync(path.resolve(inputs[id]));
    const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);

    console.log(`Process font ${inputs[id]}`);
    fp.addFont(font);
}

for (let id = 0; id < fp.fonts.length; id++) {
    console.log(`Write font -> ${outputs[id]}`);
    const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(fp.fonts[id], cfg));
    fs.writeFileSync(path.resolve(outputs[id]), buf1);
}
