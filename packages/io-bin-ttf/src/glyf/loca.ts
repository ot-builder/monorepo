import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Head, Maxp } from "@ot-builder/ft-metadata";

export const LocaTag = "loca";
export interface LocaTable {
    glyphOffsets: number[];
}

export const LocaTableIo = {
    read(view: BinaryView, head: Head.Table, maxp: Maxp.Table): LocaTable {
        const indexToLocFormat = head.indexToLocFormat;
        const numGlyphs = maxp.numGlyphs;
        let offsets: number[] = [];

        for (let gid = 0; gid <= numGlyphs; gid++) {
            if (indexToLocFormat === 0) {
                offsets.push(view.uint16() * 2);
            } else {
                offsets.push(view.uint32() * 1);
            }
        }

        return { glyphOffsets: offsets };
    },
    write(frag: Frag, loca: LocaTable, head: Head.Table) {
        let canUseFormat0 = true;
        for (const offset of loca.glyphOffsets) {
            if (offset > 0xffff * 2 || offset % 2) canUseFormat0 = false;
        }
        if (canUseFormat0) {
            head.indexToLocFormat = 0;
            for (const offset of loca.glyphOffsets) {
                frag.uint16(offset >>> 1);
            }
        } else {
            head.indexToLocFormat = 1;
            for (const offset of loca.glyphOffsets) {
                frag.uint32(offset);
            }
        }
    }
};
