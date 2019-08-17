import { BinaryView, Frag, Read, WriteOpt } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyphOrder } from "@ot-builder/ft-glyphs";

export enum SubtableHandlerKey {
    UnicodeBmp = 1,
    UnicodeFull = 2,
    UnicodeVS = 3
}

export interface SubtableHandler
    extends Read<void, [OtGlyphOrder]>,
        WriteOpt<Cmap.Table, [OtGlyphOrder]> {
    readonly key?: number;
    acceptEncoding(platform: number, encoding: number, format: number): boolean;
    apply(cmap: Cmap.Table): void;

    createAssignments(frag: Frag): SubtableAssignment[];
}

export type SubtableAssignment = {
    platform: number;
    encoding: number;
    frag: Frag;
};

export type SubtableRawData = {
    platform: number;
    encoding: number;
    format: number;
    view: BinaryView;
};
