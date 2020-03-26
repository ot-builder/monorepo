import { BinaryView, Frag } from "@ot-builder/bin-util";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Sfnt } from "@ot-builder/ot-sfnt";

export function readSfntOtf(buf: Buffer) {
    return new BinaryView(buf).next(SfntOtf);
}
export function writeSfntOtf(sfnt: Sfnt) {
    return Frag.packFrom(SfntOtf, sfnt);
}
