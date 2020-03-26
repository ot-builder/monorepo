import { BinaryView, Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";

import { OtlStat } from "../stat";

export interface SubtableReadingContext<L> {
    crossReferences: Data.Order<L>;
    gOrd: Data.Order<OtGlyph>;
    ivs: Data.Maybe<ReadTimeIVS>;
}
export interface SubtableWriteContext<L> {
    trick: number;
    crossReferences: Data.Order<L>;
    gOrd: Data.Order<OtGlyph>;
    ivs: Data.Maybe<WriteTimeIVS>;
    stat: OtlStat;
}

export interface LookupReader<L, C extends L> {
    createLookup(): C;
    parseSubtable(view: BinaryView, lookup: C, context: SubtableReadingContext<L>): void;
}

export interface LookupWriter<L, C extends L> {
    canBeUsed(lookup: L): lookup is L & C;

    getLookupType(lookup: C): number;
    createSubtableFragments(lookup: C, context: SubtableWriteContext<L>): Frag[];
}

export interface LookupReaderFactory<L> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReader(format: number): LookupReader<L, any>;
    isExtendedFormat(format: number): boolean;
}

export interface LookupWriterFactory<L> {
    readonly extendedFormat: number;
    // Actually: ReadonlyArray<∃C. LookupWriter<L, C>>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writers(): Iterable<LookupWriter<L, any>>;
}

export const SubtableSizeLimit = 0x8000;

export enum LookupFlag {
    RightToLeft = 1,
    IgnoreBaseGlyphs = 2,
    IgnoreLigatures = 4,
    IgnoreMarks = 8,
    UseMarkFilteringSet = 0x0010,
    MarkAttachmentType = 0xff00
}

export enum SubtableWriteTrick {
    AvoidUseExtension = 1,
    AvoidBreakSubtable = 2,
    UseFlatCoverageForSingleLookup = 4,

    ChainingForceFormat3 = 0x100,
    ChainingForceFormat2 = 0x200
}
