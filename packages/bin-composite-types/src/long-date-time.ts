import { Read, Write } from "@ot-builder/bin-util";

const Power2To32 = 0x0100000000;
const OtBaseEpoch = Date.UTC(1904, 1, 1);

export const LongDateTime = {
    ...Read<Date>(view => {
        const high = view.uint32();
        const low = view.uint32();
        return new Date((high * Power2To32 + low) * 1000 + OtBaseEpoch);
    }),
    ...Write<Date>((fr, date) => {
        const time = Math.round((date.getTime() - OtBaseEpoch) / 1000);
        const high = (time / Power2To32) >>> 0;
        const low = time % Power2To32;
        fr.uint32(high);
        fr.uint32(low);
    })
};
