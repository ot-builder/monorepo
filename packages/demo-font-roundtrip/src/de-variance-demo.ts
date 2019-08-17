import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtFont } from "@ot-builder/font";
import { OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { Fvar } from "@ot-builder/ft-metadata";
import { FontIoConfig, readFont, writeFont } from "@ot-builder/io-bin-font";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Rectify } from "@ot-builder/rectify";
import { rectifyFontCoords } from "@ot-builder/rectify-font";
import { OtVar } from "@ot-builder/variance";
import * as fs from "fs";
import * as path from "path";

const file = process.argv[2];
const instance = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Config.create<FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const sfnt = new BinaryView(bufFont).next(SfntOtf);
const font = readFont(sfnt, OtListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

if (font.fvar) {
    rectifyFontCoords(createAxisRectifier(), createValueRectifier(font.fvar.axes, instance), font);
    font.fvar = font.avar = null;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const sfnt1 = writeFont(font, cfg);
const buf1 = Frag.packFrom(SfntOtf, sfnt1);
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

function createAxisRectifier(): Rectify.Axis.RectifierT<Fvar.Axis> {
    return {
        axis: a => null,
        addedAxes: []
    };
}
function normalize(axis: OtVar.Axis, userValue: number) {
    if (userValue < axis.min) userValue = axis.min;
    if (userValue > axis.max) userValue = axis.max;
    if (userValue < axis.default) {
        return -(axis.default - userValue) / (axis.default - axis.min);
    } else if (userValue > axis.default) {
        return (userValue - axis.default) / (axis.max - axis.default);
    } else {
        return 0;
    }
}
function parseInstance(axes: Iterable<Fvar.Axis>, strInstance: string) {
    const seg = strInstance.split(/[,;]/g);
    if (!seg.length) return null;
    const instance: Map<Fvar.Axis, number> = new Map();
    for (const s of seg) {
        const parts = s.split("=").map(s => s.trim());
        if (parts.length !== 2) continue;
        const axisTag = parts[0],
            val = parseFloat(parts[1]);
        if (!isFinite(val)) continue;
        for (const a of axes) {
            if (a.tag === axisTag) {
                instance.set(a, normalize(a, val));
            }
        }
    }
    if (!instance.size) return null;
    else return instance;
}
function createValueRectifier(axes: Iterable<Fvar.Axis>, strInstance: string): OtVar.Rectifier {
    const instance = parseInstance(axes, strInstance);
    return {
        coord: x => OtVar.Ops.evaluate(x, instance),
        cv: x => OtVar.Ops.evaluate(x, instance)
    };
}
