import { Read, Write } from "@ot-builder/bin-util";

export const CffIndexCount = {
    ...Read((view, version: number) => {
        return version <= 1 ? view.uint16() : view.uint32();
    }),
    ...Write((frag, count: number, version: number) => {
        if (version <= 1) {
            frag.uint16(count);
        } else {
            frag.uint32(count);
        }
    })
};
