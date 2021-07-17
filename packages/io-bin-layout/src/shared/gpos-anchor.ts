import * as crypto from "crypto";

import { NonNullablePtr16, NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { Int16, UInt16 } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { Ptr16DeviceTable } from "./device-table";
import { hashVarVal } from "./gpos-adjust";

function anchorNeedsFormat3(a: Gpos.Anchor) {
    return !OtVar.Ops.isConstant(a.x) || !OtVar.Ops.isConstant(a.y) || a.xDevice || a.yDevice;
}

export const GposAnchor = {
    read(bp: BinaryView, ivs: Data.Maybe<ReadTimeIVS>): Gpos.Anchor {
        const format = bp.uint16();
        if (format === 1) {
            return {
                x: bp.int16(),
                y: bp.int16()
            };
        } else if (format === 2) {
            return {
                x: bp.int16(),
                y: bp.int16(),
                attachToPoint: { pointIndex: bp.uint16() }
            };
        } else if (format === 3) {
            const x: OtVar.Value = bp.int16();
            const y: OtVar.Value = bp.int16();
            const xDD = bp.next(Ptr16DeviceTable, ivs);
            const yDD = bp.next(Ptr16DeviceTable, ivs);
            return {
                x: OtVar.Ops.add(x, xDD ? xDD.variation : 0),
                y: OtVar.Ops.add(y, yDD ? yDD.variation : 0),
                xDevice: xDD ? xDD.deviceDeltas : null,
                yDevice: yDD ? yDD.deviceDeltas : null
            };
        } else {
            throw Errors.FormatNotSupported("anchor", format);
        }
    },
    write(bb: Frag, a: Gpos.Anchor, ivs: Data.Maybe<WriteTimeIVS>) {
        if (a.attachToPoint) {
            bb.uint16(2);
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.x)));
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.y)));
            bb.uint16(a.attachToPoint.pointIndex);
        } else if (anchorNeedsFormat3(a)) {
            const dtX = { variation: a.x, deviceDeltas: a.xDevice };
            const dtY = { variation: a.y, deviceDeltas: a.yDevice };
            bb.uint16(3);
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.x)));
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.y)));
            bb.push(Ptr16DeviceTable, dtX, ivs);
            bb.push(Ptr16DeviceTable, dtY, ivs);
        } else {
            bb.uint16(1);
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.x)));
            bb.int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(a.y)));
        }
    },
    measure(a: Data.Maybe<Gpos.Anchor>) {
        if (!a) return 0;
        const staticSize = Int16.size * 3;
        if (a.attachToPoint) {
            return staticSize + Int16.size;
        } else if (!anchorNeedsFormat3(a)) {
            return staticSize;
        } else {
            return (
                staticSize +
                UInt16.size * 8 +
                (a.xDevice ? a.xDevice.length : 0) +
                (a.yDevice ? a.yDevice.length : 0)
            );
        }
    },
    hash(a: Gpos.Anchor, ivs: Data.Maybe<WriteTimeIVS>) {
        const hasher = new ImpLib.Hasher();
        hashVarVal(hasher.begin(), ivs, a.x, a.xDevice);
        hashVarVal(hasher.begin(), ivs, a.y, a.yDevice);
        if (a.attachToPoint) {
            hasher.beginSubObj("attachToPoint").number(a.attachToPoint.pointIndex);
        }

        const sink = crypto.createHash("sha256");
        hasher.transfer(sink);
        return sink.digest("hex");
    },
    hashMeasure(col: Set<string>, ivs: Data.Maybe<WriteTimeIVS>, anchor: Data.Maybe<Gpos.Anchor>) {
        if (!anchor) return 0;
        const hash = GposAnchor.hash(anchor, ivs);
        if (col.has(hash)) {
            return 0;
        } else {
            col.add(hash);
            return GposAnchor.measure(anchor);
        }
    }
};

export const NullablePtr16GposAnchor = NullablePtr16(GposAnchor);
export const Ptr16GposAnchor = NonNullablePtr16(GposAnchor);
