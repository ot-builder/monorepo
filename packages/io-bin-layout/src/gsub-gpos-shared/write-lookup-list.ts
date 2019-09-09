import { Frag, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef, GsubGpos } from "@ot-builder/ft-layout";
import { Control, Data } from "@ot-builder/prelude";
import { UInt16, UInt32 } from "@ot-builder/primitive";
import { WriteTimeIVS } from "@ot-builder/var-store";
import * as crypto from "crypto";

import { EmptyStat, OtlStat } from "../stat";

import { decideIgnoreFlags } from "./decide-ignore-flags";
import {
    LookupFlag,
    LookupWriterFactory,
    SubtableWriteContext,
    SubtableWriteTrick
} from "./general";

///////////////////////////////////////////////////////////////////////////////////////////////////

export interface LookupWriteContext {
    gOrd: Data.Order<OtGlyph>;
    gdef?: Data.Maybe<Gdef.Table>;
    ivs?: Data.Maybe<WriteTimeIVS>;
    tricks?: Data.Maybe<Map<GsubGpos.Lookup, number>>;
    stat?: Data.Maybe<OtlStat>;
}

interface LookupHeader {
    lookupType: number;
    flags: number;
    markFilteringSet: Data.Maybe<number>;
    subtableStubs: SubtableStub[];
    useExtension: boolean;
}
interface SubtableStub {
    blob: SubtableBlob;
    startOffset: number;
}
interface SubtableBlob {
    priority: number;
    buffer: Buffer;
    relOffset: number;
}

const SizeOfExtSubtable = UInt16.size * 2 + UInt32.size;

class LookupListWriter {
    /** Measure lookup header size without extension -- used when writing headers */
    private measureHeaderSize(h: LookupHeader) {
        return (
            UInt16.size * (3 + h.subtableStubs.length) +
            (h.markFilteringSet != null ? UInt16.size : 0)
        );
    }
    /** Measure lookup header size with extension -- used when writing subtable */
    private measureHeaderSizeWithExtension(h: LookupHeader) {
        return (
            this.measureHeaderSize(h) +
            (h.useExtension ? SizeOfExtSubtable * h.subtableStubs.length : 0)
        );
    }
    private lookupHeaders: LookupHeader[] = [];
    private subtableBlobs: SubtableBlob[] = [];
    private subtableBlobHash: Map<string, SubtableBlob> = new Map();

    public pushLookup(
        lookup: GsubGpos.Lookup,
        lwf: LookupWriterFactory<GsubGpos.Lookup>,
        gdef: Data.Maybe<Gdef.Table>,
        context: SubtableWriteContext<GsubGpos.Lookup>
    ) {
        const { flags, markFilteringSet } = this.getIgnoreFlags(lookup, gdef);
        for (const writer of lwf.writers()) {
            if (!writer.canBeUsed(lookup)) continue;
            const header: LookupHeader = {
                lookupType: writer.getLookupType(lookup),
                flags,
                markFilteringSet,
                useExtension: false,
                subtableStubs: []
            };
            this.lookupHeaders.push(header);
            const subtables = writer.createSubtableFragments(lookup, context);
            this.addSubtables(header, subtables, context.trick);
        }
    }

    private getIgnoreFlags(lookup: GsubGpos.Lookup, gdef: Data.Maybe<Gdef.Table>) {
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
            if (ignore.ignoreMarks) flags |= LookupFlag.IgnoreMarks;
            if (ignore.ignoreLigatures) flags |= LookupFlag.IgnoreLigatures;
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

    private addBlob(blob: SubtableBlob) {
        const sha = crypto.createHash("sha256");
        sha.update(blob.buffer);
        const hash = sha.digest("hex");

        const existing = this.subtableBlobHash.get(hash);
        if (existing) {
            existing.priority = Math.max(existing.priority, blob.priority);
            return existing;
        } else {
            this.subtableBlobs.push(blob);
            this.subtableBlobHash.set(hash, blob);
            return blob;
        }
    }

    private addSubtables(h: LookupHeader, sts: ReadonlyArray<Frag>, trick: number = 0) {
        const pm = Frag.packMany(sts);
        const blob0: SubtableBlob = {
            buffer: pm.buffer,
            relOffset: 0,
            priority: trick & SubtableWriteTrick.AvoidUseExtension ? 1 : 2
        };
        const blob = this.addBlob(blob0);

        for (let stid = 0; stid < sts.length; stid++) {
            h.subtableStubs.push({ blob, startOffset: pm.rootOffsets[stid] });
        }
    }

    private allocateOffset() {
        this.subtableBlobs.sort(
            (a, b) => a.priority - b.priority || a.buffer.byteLength - b.buffer.byteLength
        );
        let off = 0;
        for (let st of this.subtableBlobs) {
            st.relOffset = off;
            off += st.buffer.byteLength;
        }
    }
    private tryStabilize() {
        let headerSize = this.getHeaderTotalSize();

        let headerOffset = 0;
        for (let lid = 0; lid < this.lookupHeaders.length; lid++) {
            const h = this.lookupHeaders[lid];
            for (const stub of h.subtableStubs) {
                if (
                    !h.useExtension &&
                    stub.blob.relOffset + stub.startOffset + headerSize - headerOffset > 0xfffe
                ) {
                    h.useExtension = true;
                    return true;
                }
            }
            headerOffset += this.measureHeaderSizeWithExtension(this.lookupHeaders[lid]);
        }

        return false;
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
        let headerOffsets: number[] = [];
        for (let lid = 0; lid < this.lookupHeaders.length; lid++) {
            const h = this.lookupHeaders[lid];
            const hs = this.measureHeaderSizeWithExtension(h);
            headerOffsets.push(headerOffset);
            headerOffset += hs;
        }
        return headerOffsets;
    }

    public write(frag: Frag, lwf: LookupWriterFactory<GsubGpos.Lookup>) {
        const hps = this.getHeaderPointersSize();
        const hts = this.getHeaderTotalSize();
        const ho = this.getHeaderOffsets(hps);

        // write offset array
        frag.uint16(this.lookupHeaders.length);
        for (const offset of ho) frag.uint16(offset);
        Assert.SizeMatch("HPS", frag.size, hps);

        // write headers
        for (const [h, o] of Control.ZipWithIndex(this.lookupHeaders, ho)) {
            Assert.OffsetMatch("header", frag.size, o);
            const hsNonExt = this.measureHeaderSize(h);
            frag.uint16(h.useExtension ? lwf.extendedFormat : h.lookupType);
            frag.uint16(h.flags);
            frag.uint16(h.subtableStubs.length);
            if (h.useExtension) {
                let oExt = hsNonExt;
                for (const stub of h.subtableStubs) {
                    frag.uint16(oExt);
                    oExt += SizeOfExtSubtable;
                }
            } else {
                for (const stub of h.subtableStubs) {
                    frag.uint16(stub.blob.relOffset + stub.startOffset + hps + hts - o);
                }
            }
            if (h.markFilteringSet != null) frag.uint16(h.markFilteringSet);
            if (h.useExtension) {
                let oExt = o + hsNonExt;
                for (const stub of h.subtableStubs) {
                    frag.uint16(1);
                    frag.uint16(h.lookupType);
                    frag.uint32(stub.blob.relOffset + stub.startOffset + hps + hts - oExt);
                    oExt += SizeOfExtSubtable;
                }
            }
        }
        Assert.SizeMatch("HPS+HTS", frag.size, hps + hts);

        // Write subtable bytes
        for (const blob of this.subtableBlobs) {
            Assert.OffsetMatch("Subtable", frag.size, hps + hts + blob.relOffset);
            frag.bytes(blob.buffer);
        }
    }
}

export const WriteLookupList = Write(
    (
        frag: Frag,
        lookups: GsubGpos.Lookup[],
        lwf: LookupWriterFactory<GsubGpos.Lookup>,
        lwc: LookupWriteContext
    ) => {
        const crossReferences = Data.Order.fromList(`Lookups`, lookups);
        const llw = new LookupListWriter();
        for (const lookup of lookups) {
            const trick = lwc.tricks ? lwc.tricks.get(lookup) || 0 : 0;
            llw.pushLookup(lookup, lwf, lwc.gdef, {
                trick,
                gOrd: lwc.gOrd,
                crossReferences,
                ivs: lwc.ivs,
                stat: lwc.stat || new EmptyStat()
            });
        }
        llw.stabilize();
        frag.push(llw, lwf);
    }
);
