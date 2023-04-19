import { Frag, Write } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef, Gpos, Gsub, GsubGpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16, UInt32 } from "@ot-builder/primitive";
import { WriteTimeIVS } from "@ot-builder/var-store";

import { LookupWriteTrick } from "../cfg";
import { EmptyStat, OtlStat } from "../stat";

import { decideIgnoreFlags } from "./decide-ignore-flags";
import { LookupFlag, LookupWriterFactory, SubtableWriteContext } from "./general";

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface LookupWriteContext<L> {
    gOrd: Data.Order<OtGlyph>;
    gdef?: Data.Maybe<Gdef.Table>;
    ivs?: Data.Maybe<WriteTimeIVS>;
    tricks?: Data.Maybe<Map<L, LookupWriteTrick>>;
    stat?: Data.Maybe<OtlStat>;
}

interface LookupHeader {
    lookupType: number;
    origLookupType: symbol;
    flags: number;
    markFilteringSet: Data.Maybe<number>;
    rank: number;
    subtableIDs: number[];
    useExtension: boolean;
}

const SizeOfExtSubtable = UInt16.size * 2 + UInt32.size;

class SubtableArranger {
    private frags: Frag[] = [];
    private fragOffsets: number[] = [];

    public relOffset = 0;
    public size = 0;
    public buffer: null | Buffer = null;

    public addSubtableFrag(fr: Frag) {
        const n = this.frags.length;
        this.frags[n] = fr;
        return n;
    }

    public consolidate() {
        if (!this.buffer) {
            const { buffer, rootOffsets } = Frag.packMany(this.frags);
            this.buffer = buffer;
            this.size = buffer.byteLength;
            this.fragOffsets = [...rootOffsets];
        }
    }

    public getOffset(frIndex: number) {
        this.consolidate();
        return this.fragOffsets[frIndex];
    }
}

class LookupListWriter<L extends GsubGpos.LookupProp> {
    /** Measure lookup header size without extension -- used when writing headers */
    private measureHeaderSize(h: LookupHeader) {
        return (
            UInt16.size * (3 + h.subtableIDs.length) +
            (h.markFilteringSet != null ? UInt16.size : 0)
        );
    }
    /** Measure lookup header size with extension -- used when writing subtable */
    private measureHeaderSizeWithExtension(h: LookupHeader) {
        return (
            this.measureHeaderSize(h) +
            (h.useExtension ? SizeOfExtSubtable * h.subtableIDs.length : 0)
        );
    }
    private lookupHeaders: LookupHeader[] = [];
    private arrangers: (null | SubtableArranger)[] = [];

    public pushLookup(
        lookup: L,
        lookupIsDependency: boolean,
        lwf: LookupWriterFactory<L>,
        gdef: Data.Maybe<Gdef.Table>,
        context: SubtableWriteContext<L>
    ) {
        const { flags, markFilteringSet } = this.getIgnoreFlags(lookup, gdef);
        for (const writer of lwf.writers()) {
            if (!writer.canBeUsed(lookup)) continue;
            const header: LookupHeader = {
                origLookupType: writer.getLookupTypeSymbol(lookup),
                lookupType: writer.getLookupType(lookup, context),
                flags,
                markFilteringSet,
                rank: this.getLookupRank(
                    writer.getLookupTypeSymbol(lookup),
                    lookupIsDependency,
                    context.trick
                ),
                subtableIDs: [],
                useExtension: false
            };
            this.lookupHeaders.push(header);
            const subtables = writer.createSubtableFragments(lookup, context);
            this.addSubtables(header, subtables, context.trick);
        }
    }

    private getLookupRank(origType: symbol, isDependency: boolean, trick: LookupWriteTrick) {
        const rankTrick = 16 * (trick & LookupWriteTrick.AvoidUseExtension ? 1 : 2);
        const rankType =
            origType === Gsub.LookupType.Reverse
                ? 1
                : origType === Gsub.LookupType.Chaining || origType === Gpos.LookupType.Chaining
                ? 2
                : origType === Gsub.LookupType.Single || origType === Gpos.LookupType.Single
                ? 4 + (isDependency ? 0 : 3)
                : 3 + (isDependency ? 0 : 3);
        return rankTrick + rankType;
    }

    private getIgnoreFlags(lookup: L, gdef: Data.Maybe<Gdef.Table>) {
        const ignore = decideIgnoreFlags(lookup.ignoreGlyphs, gdef) || {
            ignoreBaseGlyphs: false,
            ignoreLigatures: false,
            ignoreMarks: false
        };
        let flags = 0;
        let markFilteringSet: Data.Maybe<number> = undefined;
        if (lookup.rightToLeft) flags |= LookupFlag.RightToLeft;
        if (ignore) {
            if (ignore.ignoreBaseGlyphs) flags |= LookupFlag.IgnoreBaseGlyphs;
            if (ignore.ignoreLigatures) flags |= LookupFlag.IgnoreLigatures;
            if (ignore.ignoreMarks) flags |= LookupFlag.IgnoreMarks;
            if (ignore.markAttachmentType != null) {
                flags |= ignore.markAttachmentType << 8;
            }
            if (ignore.markFilteringSet != null) {
                flags |= LookupFlag.UseMarkFilteringSet;
                markFilteringSet = ignore.markFilteringSet;
            }
        }
        return { flags, markFilteringSet };
    }

    private addSubtables(h: LookupHeader, sts: ReadonlyArray<Frag>, trick: number = 0) {
        const arranger = this.getArrangerOf(h);
        for (const st of sts) h.subtableIDs.push(arranger.addSubtableFrag(st));
    }
    private getArrangerOf(h: LookupHeader) {
        let arr = this.arrangers[h.rank];
        if (!arr) {
            arr = new SubtableArranger();
            this.arrangers[h.rank] = arr;
        }
        return arr;
    }

    private allocateOffset() {
        let off = 0;
        for (const arranger of this.arrangers) {
            if (!arranger) continue;
            arranger.relOffset = off;
            arranger.consolidate();
            off += arranger.size;
        }
    }
    private tryStabilize() {
        const hts = this.getHeaderTotalSize();
        const ho = this.getHeaderOffsets(0);
        let lidConvertible = -1;
        let lidConvertibleRank = 0;
        for (const [h, o, lid] of ImpLib.Iterators.ZipWithIndexReverse(this.lookupHeaders, ho)) {
            const arranger = this.getArrangerOf(h);
            for (const stid of h.subtableIDs) {
                const stOffset = arranger.getOffset(stid);
                if (h.useExtension || arranger.relOffset + stOffset + hts - o <= 0xfffe) continue;
                if (lidConvertible < 0 || h.rank > lidConvertibleRank) {
                    lidConvertible = lid;
                    lidConvertibleRank = h.rank;
                }
            }
        }
        if (lidConvertible >= 0) {
            this.lookupHeaders[lidConvertible].useExtension = true;
            return true;
        } else {
            return false;
        }
    }
    public stabilize() {
        for (const h of this.lookupHeaders) h.useExtension = false;
        this.allocateOffset();
        while (this.tryStabilize());
    }

    private getHeaderPointersSize() {
        return UInt16.size * (1 + this.lookupHeaders.length);
    }
    private getHeaderTotalSize() {
        let headerSize = 0;
        for (let lid = 0; lid < this.lookupHeaders.length; lid++) {
            headerSize += this.measureHeaderSizeWithExtension(this.lookupHeaders[lid]);
        }
        return headerSize;
    }

    private getHeaderOffsets(hps: number) {
        let headerOffset = hps;
        const headerOffsets: number[] = [];
        for (let lid = 0; lid < this.lookupHeaders.length; lid++) {
            const h = this.lookupHeaders[lid];
            const hs = this.measureHeaderSizeWithExtension(h);
            headerOffsets.push(headerOffset);
            headerOffset += hs;
        }
        return headerOffsets;
    }

    public write(frag: Frag, lwf: LookupWriterFactory<L>) {
        const hps = this.getHeaderPointersSize();
        const hts = this.getHeaderTotalSize();
        const ho = this.getHeaderOffsets(hps);

        // write offset array
        frag.uint16(this.lookupHeaders.length);
        for (const offset of ho) frag.uint16(offset);
        Assert.SizeMatch("HPS", frag.size, hps);

        // write headers
        for (const [h, o] of ImpLib.Iterators.ZipWithIndex(this.lookupHeaders, ho)) {
            Assert.OffsetMatch("header", frag.size, o);
            const hsNonExt = this.measureHeaderSize(h);
            frag.uint16(h.useExtension ? lwf.extendedFormat : h.lookupType);
            frag.uint16(h.flags);
            frag.uint16(h.subtableIDs.length);
            if (h.useExtension) {
                let oExt = hsNonExt;
                for (const stid of h.subtableIDs) {
                    frag.uint16(oExt);
                    oExt += SizeOfExtSubtable;
                }
            } else {
                const arranger = this.getArrangerOf(h);
                for (const stid of h.subtableIDs) {
                    const stOffset = arranger.getOffset(stid);
                    frag.uint16(arranger.relOffset + stOffset + hps + hts - o);
                }
            }
            if (h.markFilteringSet != null) frag.uint16(h.markFilteringSet);
            if (h.useExtension) {
                let oExt = o + hsNonExt;
                const arranger = this.getArrangerOf(h);

                for (const stid of h.subtableIDs) {
                    const stOffset = arranger.getOffset(stid);
                    frag.uint16(1);
                    frag.uint16(h.lookupType);
                    frag.uint32(arranger.relOffset + stOffset + hps + hts - oExt);
                    oExt += SizeOfExtSubtable;
                }
            }
        }
        Assert.SizeMatch("HPS+HTS", frag.size, hps + hts);

        // Write subtable bytes
        for (const arranger of this.arrangers) {
            if (!arranger) continue;
            Assert.OffsetMatch("Subtable", frag.size, hps + hts + arranger.relOffset);
            if (!arranger.buffer) throw Errors.Unreachable();
            frag.bytes(arranger.buffer);
        }
    }
}

export const WriteLookupList = Write(function <L extends GsubGpos.LookupProp>(
    frag: Frag,
    lookups: L[],
    lwf: LookupWriterFactory<L>,
    lwc: LookupWriteContext<L>
) {
    const crossReferences = ImpLib.Order.fromList(`Lookups`, lookups);
    const llw = new LookupListWriter();
    const dependentLookups: Set<L> = new Set();
    for (const lookup of lookups) {
        for (const dep of lwf.queryDependencies(lookup)) dependentLookups.add(dep);
    }
    for (const lookup of lookups) {
        const trick = lwc.tricks
            ? lwc.tricks.get(lookup) || LookupWriteTrick.None
            : LookupWriteTrick.None;
        llw.pushLookup(lookup, dependentLookups.has(lookup), lwf, lwc.gdef, {
            trick,
            gOrd: lwc.gOrd,
            crossReferences,
            ivs: lwc.ivs,
            stat: lwc.stat || new EmptyStat()
        });
    }
    llw.stabilize();
    frag.push(llw, lwf);
});
