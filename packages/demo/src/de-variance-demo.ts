import * as fs from "fs";
import * as path from "path";
import { FontIo, Ot, Rectify } from "ot-builder";

import { StdPointAttachRectifier } from "./point-rectifier";

const file = process.argv[2];
const instance = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = {};

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = FontIo.readFont(FontIo.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

if (font.fvar) {
    Rectify.rectifyFontCoords(
        createAxisRectifier(),
        createValueRectifier(font.fvar.axes, instance),
        new StdPointAttachRectifier(Rectify.PointAttachmentRectifyManner.TrustAttachment),
        font
    );
    font.fvar = font.avar = null;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = FontIo.writeSfntOtf(FontIo.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createAxisRectifier(): Rectify.AxisRectifier {
    return {
        dim: a => null,
        axis: a => null,
        addedAxes: []
    };
}
function normalize(dim: Ot.Var.Dim, userValue: number) {
    if (userValue < dim.min) userValue = dim.min;
    if (userValue > dim.max) userValue = dim.max;
    if (userValue < dim.default) {
        return -(dim.default - userValue) / (dim.default - dim.min);
    } else if (userValue > dim.default) {
        return (userValue - dim.default) / (dim.max - dim.default);
    } else {
        return 0;
    }
}
function parseInstance(axes: Iterable<Ot.Fvar.Axis>, strInstance: string) {
    const seg = strInstance.split(/[,;]/g);
    if (!seg.length) return null;
    const instance: Map<Ot.Var.Dim, number> = new Map();
    for (const s of seg) {
        const parts = s.split("=").map(s => s.trim());
        if (parts.length !== 2) continue;
        const axisTag = parts[0],
            val = parseFloat(parts[1]);
        if (!isFinite(val)) continue;
        for (const a of axes) {
            if (a.dim.tag === axisTag) {
                instance.set(a.dim, normalize(a.dim, val));
            }
        }
    }
    if (!instance.size) return null;
    else return instance;
}
function createValueRectifier(
    axes: Iterable<Ot.Fvar.Axis>,
    strInstance: string
): Rectify.CoordRectifier {
    const instance = parseInstance(axes, strInstance);
    return {
        coord: x => Ot.Var.Ops.evaluate(x, instance),
        cv: x => Ot.Var.Ops.evaluate(x, instance)
    };
}
