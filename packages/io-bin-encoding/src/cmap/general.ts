import { BinaryView, Frag, Read, WriteOpt } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { EncodingCfg } from "../cfg";

export enum SubtableHandlerKey {
    UnicodeBmp = 1,
    UnicodeFull = 2,
    UnicodeVS = 3
}
export type SubtableWriteOptions = EncodingCfg & {
    forceWriteUnicodeFull?: boolean;
};

export interface SubtableHandler
    extends Read<void, [Data.Order<OtGlyph>]>,
        WriteOpt<Cmap.Table, [Data.Order<OtGlyph>, SubtableWriteOptions]> {
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
