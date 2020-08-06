import { NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Math as OtMath } from "@ot-builder/ot-layout";

import { MathValueRecord } from "../shared/math-value-record";

const MathKern = {
    read(bv: BinaryView) {
        const heightCount = bv.uint16();
        const correctionHeight = bv.array(heightCount, MathValueRecord);
        const kernValues = bv.array(heightCount + 1, MathValueRecord);
        return new OtMath.Kern(
            kernValues[heightCount],
            Array.from(ImpLib.Iterators.Zip(correctionHeight, kernValues.slice(0, heightCount)))
        );
    },
    write(fr: Frag, x: OtMath.Kern) {
        const correctionHeight: OtMath.ValueRecord[] = [];
        const kernValues: OtMath.ValueRecord[] = [];
        for (const [h, v] of x.corrections) correctionHeight.push(h), kernValues.push(v);
        kernValues.push(x.kernValue);
        fr.uint16(correctionHeight.length);
        fr.arrayN(MathValueRecord, correctionHeight.length, correctionHeight);
        fr.arrayN(MathValueRecord, correctionHeight.length + 1, kernValues);
    }
};
const Ptr16MathKernNullable = NullablePtr16(MathKern);

export const MathKernInfo = {
    read(bv: BinaryView) {
        const topRight = bv.next(Ptr16MathKernNullable);
        const topLeft = bv.next(Ptr16MathKernNullable);
        const bottomRight = bv.next(Ptr16MathKernNullable);
        const bottomLeft = bv.next(Ptr16MathKernNullable);
        return new OtMath.KernInfo(topRight, topLeft, bottomRight, bottomLeft);
    },
    write(fr: Frag, ki: OtMath.KernInfo) {
        fr.push(Ptr16MathKernNullable, ki.topRight);
        fr.push(Ptr16MathKernNullable, ki.topLeft);
        fr.push(Ptr16MathKernNullable, ki.bottomRight);
        fr.push(Ptr16MathKernNullable, ki.bottomLeft);
    }
};
