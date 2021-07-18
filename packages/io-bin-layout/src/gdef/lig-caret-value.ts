import { Read, Write } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { Ptr16DeviceTable } from "../shared/device-table";

export const CaretValue = {
    ...Read((view, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                return view.next(CaretValueFormat1);
            case 2:
                return view.next(CaretValueFormat2);
            case 3:
                return view.next(CaretValueFormat3, ivs);
            default:
                throw Errors.FormatNotSupported("ligCaretValue", format);
        }
    }),
    ...Write((frag, caret: Gdef.LigCaret, ivs?: Data.Maybe<WriteTimeIVS>) => {
        if (caret.pointAttachment) return frag.push(CaretValueFormat2, caret);
        else return frag.push(CaretValueFormat3, caret, ivs);
    })
};

const CaretValueFormat1 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 1) throw Errors.Unreachable();
        return { x: view.uint16() } as Gdef.LigCaret;
    }),
    ...Write((frag, caret: Gdef.LigCaret) => {
        frag.uint16(1).int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(caret.x)));
    })
};
const CaretValueFormat2 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 2) throw Errors.Unreachable();
        return { x: 0, pointAttachment: { pointIndex: view.uint16() } } as Gdef.LigCaret;
    }),
    ...Write((frag, caret: Gdef.LigCaret) => {
        if (!caret.pointAttachment) throw Errors.Unreachable();
        frag.uint16(2).int16(OtVar.Ops.originOf(caret.pointAttachment.pointIndex));
    })
};
const CaretValueFormat3 = {
    ...Read((view, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const format = view.uint16();
        if (format !== 3) throw Errors.Unreachable();
        let x: OtVar.Value = view.int16();
        const dd = view.next(Ptr16DeviceTable, ivs);
        x = OtVar.Ops.add(x, dd ? dd.variation : 0);
        return { x: x, xDevice: dd ? dd.deviceDeltas : undefined } as Gdef.LigCaret;
    }),
    ...Write((frag, caret: Gdef.LigCaret, ivs?: Data.Maybe<WriteTimeIVS>) => {
        if (OtVar.Ops.isConstant(caret.x) && !caret.xDevice) {
            frag.push(CaretValueFormat1, caret);
        } else {
            frag.uint16(3)
                .int16(ImpLib.Arith.Round.Coord(OtVar.Ops.originOf(caret.x)))
                .push(Ptr16DeviceTable, { deviceDeltas: caret.xDevice, variation: caret.x }, ivs);
        }
    })
};
