import { Read, Sized, Write } from "@ot-builder/bin-util";

export type Tag = string;
export const Tag: Read<Tag, []> & Write<Tag, []> & Sized = {
    size: 4,
    read(view) {
        const c1 = view.uint8();
        const c2 = view.uint8();
        const c3 = view.uint8();
        const c4 = view.uint8();
        return (
            String.fromCodePoint(c1) +
            String.fromCodePoint(c2) +
            String.fromCodePoint(c3) +
            String.fromCodePoint(c4)
        );
    },
    write(frag, tag) {
        frag.uint8(tag.codePointAt(0) || 0x20);
        frag.uint8(tag.codePointAt(1) || 0x20);
        frag.uint8(tag.codePointAt(2) || 0x20);
        frag.uint8(tag.codePointAt(3) || 0x20);
    }
};
