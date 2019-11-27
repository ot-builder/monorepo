import { Read, Write } from "@ot-builder/bin-util";

const Power2To32 = 0x0100000000;
const EpochDifference = new Date(1970, 1, 1).getTime() - new Date(1904, 1, 1).getTime();

export const LongDateTime = {
    ...Read<Date>(view => {
        const high = view.uint32();
        const low = view.uint32();
        return new Date((high * Power2To32 + low) * 1000 - EpochDifference);
    }),
    ...Write<Date>((fr, date) => {
        const time = Math.round((date.getTime() + EpochDifference) / 1000);
        const high = (time / Power2To32) >>> 0;
        const low = time % Power2To32;
        fr.uint32(high);
        fr.uint32(low);
    })
};
