import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Vdmx } from "@ot-builder/ft-metadata";
import { UInt16 } from "@ot-builder/primitive";
import { GposPairLookupIdentity } from '@ot-builder/test-util/src/layout-identity/lookup/gpos-pair';

export const VdmxRatioRange = {
    read(bp: BinaryView) {
        const r = new Vdmx.RatioRange();
        r.bCharSet = bp.uint8();
        r.xRatio = bp.uint8();
        r.yStartRatio = bp.uint8();
        r.yEndRatio = bp.uint8();
        return r;
    },

    write(b: Frag, r: Vdmx.RatioRange) {
        b.uint8(r.bCharSet);
        b.uint8(r.xRatio);
        b.uint8(r.yStartRatio);
        b.uint8(r.yEndRatio);
    }
};

export const VdmxGroup = {
    read(bp: BinaryView) {
        const entries = new Map<UInt16, Vdmx.VTableRecord>();
        const recs = bp.uint16();
        bp.uint8(); // skip `startsz`
        bp.uint8(); // skip `endsz`

        for (var i = 0; i < recs; i++) {
            const yPelHeight = bp.uint16();
            const record = new Vdmx.VTableRecord();
            record.yMax = bp.int16();
            record.yMin = bp.int16();
            entries.set(yPelHeight, record);
        }
        return entries;
    },

    write(b: Frag, entries: Map<UInt16, Vdmx.VTableRecord>) {
        const recs = entries.size;
        const sorted = [...entries.keys()].sort((a, b) => a - b);
        const startsz = sorted[0] || 0;
        const endsz = sorted[recs - 1] || 0;
        b.uint16(recs);
        b.uint8(startsz);
        b.uint8(endsz);

        for (var i = 0; i < recs; i++) {
            const yPelHeight = sorted[i];
            const record = entries.get(yPelHeight)!;
            b.uint16(yPelHeight);
            b.int16(record.yMax);
            b.int16(record.yMin);
        }
    }
}

export const VdmxTableIo = {
    read(view: BinaryView) {
        const version = view.uint16();
        const table = new Vdmx.Table(version);

        view.uint16(); // skip `numRecs`
        const numRatios = view.uint16();

        for (var i = 0; i < numRatios; i++) {
            const ratio = view.next(VdmxRatioRange);
            const group = new Vdmx.VdmxRecord();
            group.ratioRange = ratio;
            table.records.push(group);
        }

        for (var i = 0; i < numRatios; i++) {
            const entries = view.ptr16().next(VdmxGroup);
            table.records[i].entries = entries;
        }
        return table;
    },

    write(frag: Frag, table: Vdmx.Table) {
        const numRatios = table.records.length;

        frag.uint16(table.version);
        const numRecsReserve = frag.reserve(UInt16);
        frag.uint16(numRatios);

        for (var i = 0; i < numRatios; i++) {
            frag.push(VdmxRatioRange, table.records[i].ratioRange);
        }

        const groups = new Array<Frag>();
        for (var i = 0; i < numRatios; i++) {
            const group = frag.ptr16New();
            group.push(VdmxGroup, table.records[i].entries);
            groups.push(group);
        }
        const groupPack = Frag.packMany(groups);
        const numRecs = new Set(groupPack.rootOffsets).size;
        numRecsReserve.fill(numRecs);
    }
}
