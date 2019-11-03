import * as fs from "fs";
import { Ot } from "ot-builder";
import * as Ob from "ot-builder";
import * as path from "path";

const file = process.argv[2];
const instance = process.argv[3];
const fileOut = process.argv[4];

///////////////////////////////////////////////////////////////////////////////////////////////////

const cfg = Ob.Config.create<Ob.FontIoConfig>({});

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("demo start");

const bufFont = fs.readFileSync(path.resolve(file));
const font = Ob.readFont(Ob.readSfntOtf(bufFont), Ot.ListGlyphStoreFactory, cfg);
console.log("read complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

if (font.fvar) {
    Ob.rectifyFontCoords(
        createAxisRectifier(),
        createValueRectifier(font.fvar.axes, instance),
        new Ot.StdPointAttachRectifier(Ob.Rectify.PointAttach.Manner.TrustAttachment),
        font
    );
    font.fvar = font.avar = null;
}

///////////////////////////////////////////////////////////////////////////////////////////////////

console.log("write start");

const buf1 = Ob.writeSfntOtf(Ob.writeFont(font, cfg));
fs.writeFileSync(path.resolve(fileOut), buf1);

console.log("write complete");

///////////////////////////////////////////////////////////////////////////////////////////////////

function createAxisRectifier(): Ob.Rectify.Axis.RectifierT<Ot.Fvar.Axis> {
    return {
        axis: a => null,
        addedAxes: []
    };
}
function normalize(axis: Ot.Var.Axis, userValue: number) {
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
function parseInstance(axes: Iterable<Ot.Fvar.Axis>, strInstance: string) {
    const seg = strInstance.split(/[,;]/g);
    if (!seg.length) return null;
    const instance: Map<Ot.Fvar.Axis, number> = new Map();
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
function createValueRectifier(axes: Iterable<Ot.Fvar.Axis>, strInstance: string): Ot.Var.Rectifier {
    const instance = parseInstance(axes, strInstance);
    return {
        coord: x => Ot.Var.Ops.evaluate(x, instance),
        cv: x => Ot.Var.Ops.evaluate(x, instance)
    };
}
