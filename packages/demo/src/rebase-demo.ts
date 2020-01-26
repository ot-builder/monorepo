import * as fs from "fs";
import * as path from "path";
import { FontIo, Ot, Rectify } from "ot-builder";

import { StdPointAttachRectifier } from "./point-rectifier";

const file = process.argv[2];
const newUpmStr = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = {};

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

const newUpm = parseFloat(newUpmStr) || 0;
Rectify.rectifyFontCoords(
    createAxisRectifier(),
    createValueRectifier(newUpm, font.head.unitsPerEm),
    new StdPointAttachRectifier(Rectify.PointAttachmentRectifyManner.TrustAttachment),
    font
);
font.head.unitsPerEm = newUpm;

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createAxisRectifier(): Rectify.AxisRectifier {
    return {
        dim: a => a,
        axis: a => a,
        addedAxes: []
    };
}

function createValueRectifier(newUpm: number, oldUpm: number): Rectify.CoordRectifier {
    return {
        coord: x => Ot.Var.Ops.scale(newUpm / oldUpm, x),
        cv: x => Ot.Var.Ops.scale(newUpm / oldUpm, x)
    };
}
