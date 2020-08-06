import { Read, Write } from "@ot-builder/bin-util";
import { Math as OtMath } from "@ot-builder/ot-layout";
import { OtVar } from "@ot-builder/variance";

import { DeviceTable } from "./device-table";

// MATH currently doesn't have variation
export const MathValueRecord = {
    ...Read<OtMath.ValueRecord>(bp => {
        const value = bp.int16();
        const pDeviceTable = bp.ptr16Nullable();
        if (!pDeviceTable) return { value };
        const device = pDeviceTable.next(DeviceTable);
        if (device.deviceDeltas) {
            return { value, device: device.deviceDeltas };
        } else {
            return { value };
        }
    }),
    ...Write((fr, v: OtMath.ValueRecord) => {
        fr.int16(OtVar.Ops.originOf(v.value));
        if (v.device) {
            fr.ptr16New().push(DeviceTable, { variation: 0, deviceDeltas: v.device });
        } else {
            fr.ptr16(null);
        }
    })
};
