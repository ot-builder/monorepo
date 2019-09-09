import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Base } from "@ot-builder/ft-layout";
import { Arith, Data } from "@ot-builder/prelude";
import { NonNullablePtr16, NullablePtr16 } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { Ptr16DeviceTable } from "../shared/device-table";

function anchorNeedsFormat3(a: Base.Coord) {
    return !OtVar.Ops.isConstant(a.at) || a.deviceDeltas;
}

export const BaseCoord = {
    read(bp: BinaryView, gOrd: Data.Order<OtGlyph>, ivs: Data.Maybe<ReadTimeIVS>): Base.Coord {
        const format = bp.uint16();
        switch (format) {
            case 1:
                return { at: bp.int16() };
            case 2:
                return {
                    at: bp.int16(),
                    pointAttachment: { glyph: gOrd.at(bp.uint16()), pointIndex: bp.uint16() }
                };
            case 3:
                const atOrig: OtVar.Value = bp.int16();
                const atDD = bp.next(Ptr16DeviceTable, ivs);
                return {
                    at: OtVar.Ops.add(atOrig, atDD ? atDD.variation : 0),
                    deviceDeltas: atDD ? atDD.deviceDeltas : null
                };
            default:
                throw Errors.FormatNotSupported("BaseCoord", format);
        }
    },
    write(bb: Frag, a: Base.Coord, gOrd: Data.Order<OtGlyph>, ivs: Data.Maybe<WriteTimeIVS>) {
        if (a.pointAttachment) {
            bb.uint16(2);
            bb.int16(Arith.Round.Coord(OtVar.Ops.originOf(a.at)));
            bb.uint16(gOrd.reverse(a.pointAttachment.glyph));
            bb.uint16(a.pointAttachment.pointIndex);
        } else if (anchorNeedsFormat3(a)) {
            const dtAt = { variation: a.at, deviceDeltas: a.deviceDeltas };
            bb.uint16(3);
            bb.int16(Arith.Round.Coord(OtVar.Ops.originOf(a.at)));
            bb.push(Ptr16DeviceTable, dtAt, ivs);
        } else {
            bb.uint16(1);
            bb.int16(Arith.Round.Coord(OtVar.Ops.originOf(a.at)));
        }
    }
};

export const Ptr16BaseCoord = NonNullablePtr16(BaseCoord);
export const Ptr16BaseCoordNullable = NullablePtr16(BaseCoord);
