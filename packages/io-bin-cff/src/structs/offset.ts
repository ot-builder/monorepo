import { Read, Write } from "@ot-builder/bin-util";
import { UInt24 } from "@ot-builder/primitive";

export const CffOffset = {
    ...Read((view, size: number) => {
        switch (size) {
            case 1:
                return view.uint8() - 1;
            case 2:
                return view.uint16() - 1;
            case 3:
                return view.next(UInt24) - 1;
            default:
                return view.uint32() - 1;
        }
    }),
    ...Write((frag, offset: number, size: number) => {
        switch (size) {
            case 1:
                return frag.uint8(offset + 1);
            case 2:
                return frag.uint16(offset + 1);
            case 3:
                return frag.push(UInt24, offset + 1);
            default:
                return frag.uint32(offset + 1);
        }
    })
};
