import { NullablePtr16 } from "@ot-builder/bin-composite-types";
import { Read, Write } from "@ot-builder/bin-util";
import { LayoutCommon } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

enum DeltaFormat {
    LOCAL_2_BIT_DELTAS = 0x0001,
    LOCAL_4_BIT_DELTAS = 0x0002,
    LOCAL_8_BIT_DELTAS = 0x0003,
    FORMAT_MASK = 0x0003,
    VARIATION_INDEX = 0x8000,
    Reserved = 0x7ffc
}

function deviceDeltaSizeFromFormat(format: number) {
    switch (format & DeltaFormat.FORMAT_MASK) {
        case DeltaFormat.LOCAL_8_BIT_DELTAS:
            return 8;
        case DeltaFormat.LOCAL_4_BIT_DELTAS:
            return 4;
        case DeltaFormat.LOCAL_2_BIT_DELTAS:
            return 2;
        default:
            return 0;
    }
}

export const DeviceDeltaBits = {
    ...Read((bp, ppemMin: number, ppemMax: number, deltaFormat: number) => {
        const deltaBits = deviceDeltaSizeFromFormat(deltaFormat);
        if (!deltaBits) return { variation: 0 };
        const deltasPerWord = 16 / deltaBits;
        let ppem = ppemMin,
            word = 0,
            hasDelta = false;
        const deltas = [];
        do {
            if ((ppem - ppemMin) % deltasPerWord === 0) word = bp.uint16();
            deltas[ppem] = (word << 16) >> (32 - deltaBits);
            if (deltas[ppem]) hasDelta = true;
            word = (word << deltaBits) & 0xffff;
            ppem++;
        } while (ppem <= ppemMax);
        if (hasDelta) {
            return { variation: 0, deviceDeltas: deltas };
        } else {
            return { variation: 0 };
        }
    }),
    ...Write(
        (
            bb,
            deltas: ReadonlyArray<number>,
            ppemMin: number,
            ppemMax: number,
            deltaFormat: number
        ) => {
            const deltaBits = deviceDeltaSizeFromFormat(deltaFormat);
            const deltasPerWord = 16 / deltaBits;
            let word = 0,
                flushed = false;
            // Pack deltas into 16-bit words
            for (let ppem = ppemMin; ppem <= ppemMax; ppem++) {
                const seg = deltas[ppem] & ((1 << deltaBits) - 1);
                const shift = 16 - ((ppem - ppemMin) % deltasPerWord) * deltaBits - deltaBits;
                word = word | (seg << shift);
                flushed = false;
                if ((ppem + 1 - ppemMin) % deltasPerWord === 0) {
                    bb.uint16(word);
                    word = 0;
                    flushed = true;
                }
            }
            if (!flushed) bb.uint16(word);
        }
    )
};

export const EmptyDeviceTable = Write(frag => {
    frag.uint16(1);
    frag.uint16(1);
    frag.uint16(DeltaFormat.LOCAL_8_BIT_DELTAS);
    frag.uint16(0);
});

function decideDeltaFormat(deltas: ReadonlyArray<number>) {
    let format = 0;
    let ppemMin = -1,
        ppemMax = -1;
    for (let ppem = 0; ppem < deltas.length; ppem++) {
        const d = deltas[ppem] || 0;
        if (d !== 0) {
            if (format < DeltaFormat.LOCAL_2_BIT_DELTAS) {
                format = DeltaFormat.LOCAL_2_BIT_DELTAS;
            }
            if (ppemMin < 0) ppemMin = ppem;
            ppemMax = ppem;
        }
        if ((d < -2 || d > 1) && format < DeltaFormat.LOCAL_4_BIT_DELTAS) {
            format = DeltaFormat.LOCAL_4_BIT_DELTAS;
        }
        if ((d < -8 || d > 7) && format < DeltaFormat.LOCAL_8_BIT_DELTAS) {
            format = DeltaFormat.LOCAL_8_BIT_DELTAS;
        }
    }
    return { format, ppemMin, ppemMax };
}

export const DeviceTable = {
    ...Read<LayoutCommon.Adjust.DeviceDataT<OtVar.Value>, [Data.Maybe<ReadTimeIVS>?]>(
        (bp, ivs?: Data.Maybe<ReadTimeIVS>) => {
            const arg0 = bp.uint16();
            const arg1 = bp.uint16();
            const deltaFormat = bp.uint16();
            if (deltaFormat & DeltaFormat.VARIATION_INDEX) {
                if (!ivs) return { variation: 0 };
                else return { variation: ivs.queryValue(arg0, arg1) };
            } else {
                return bp.next(DeviceDeltaBits, arg0, arg1, deltaFormat);
            }
        }
    ),
    ...Write(
        (bb, v: LayoutCommon.Adjust.DeviceDataT<OtVar.Value>, ivs?: Data.Maybe<WriteTimeIVS>) => {
            if (v.deviceDeltas) {
                const { format, ppemMin, ppemMax } = decideDeltaFormat(v.deviceDeltas);
                if (!format || ppemMin < 0 || ppemMax < 0 || ppemMin > ppemMax) {
                    bb.push(EmptyDeviceTable, undefined);
                } else {
                    // write header and format
                    bb.uint16(ppemMin);
                    bb.uint16(ppemMax);
                    bb.uint16(format);
                    bb.push(DeviceDeltaBits, v.deviceDeltas, ppemMin, ppemMax, format);
                }
            } else if (ivs) {
                const a = ivs.valueToInnerOuterID(v.variation);
                if (!a) {
                    bb.push(EmptyDeviceTable, undefined);
                } else {
                    bb.uint16(a.outer);
                    bb.uint16(a.inner);
                    bb.uint16(DeltaFormat.VARIATION_INDEX);
                }
            } else {
                bb.push(EmptyDeviceTable, undefined);
            }
        }
    )
};

export const Ptr16DeviceTable = NullablePtr16(DeviceTable);
