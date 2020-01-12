import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Vdmx } from "@ot-builder/ft-metadata";
import { UInt16 } from "@ot-builder/primitive";

export const VdmxRatioRange = {
    read(bp: BinaryView) {
        return {
            bCharSet: bp.uint8(),
            xRatio: bp.uint8(),
            yStartRatio: bp.uint8(),
            yEndRatio: bp.uint8(),
        };
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

        for (let recIndex = 0; recIndex < recs; recIndex++) {
            const yPelHeight = bp.uint16();
            entries.set(yPelHeight, {
                yMax: bp.int16(),
                yMin: bp.int16(),
            });
        }
        return entries;
    },

    write(b: Frag, entries: Map<UInt16, Vdmx.VTableRecord>) {
        const recs = entries.size;
        const sorted = [...entries].sort((a, b) => a[0] - b[0]);
        const startsz = recs ? sorted[0][0] : 0;
        const endsz = recs ? sorted[recs - 1][0] : 0;
        b.uint16(recs);
        b.uint8(startsz);
        b.uint8(endsz);

        for (const entry of sorted) {
            b.uint16(entry[0]); // yPelHeight
            b.int16(entry[1].yMax);
            b.int16(entry[1].yMin);
        }
    }
}

export const VdmxTableIo = {
    read(view: BinaryView) {
        const version = view.uint16();
        const table = new Vdmx.Table(version);
        view.uint16(); // skip `numRecs`
        const numRatios = view.uint16();

        for (let ratioIndex = 0; ratioIndex < numRatios; ratioIndex++) {
            const ratio = view.next(VdmxRatioRange);
            const group = new Vdmx.VdmxRecord();
            group.ratioRange = ratio;
            table.records.push(group);
        }

        for (let groupIndex = 0; groupIndex < numRatios; groupIndex++) {
            const entries = view.ptr16().next(VdmxGroup);
            table.records[groupIndex].entries = entries;
        }
        return table;
    },

    write(frag: Frag, table: Vdmx.Table) {
        const numRatios = table.records.length;
        frag.uint16(table.version);
        const numRecsReserve = frag.reserve(UInt16);
        frag.uint16(numRatios);

        const groups = new Array<Frag>();
        for (let record of table.records) {
            frag.push(VdmxRatioRange, record.ratioRange);
            groups.push(Frag.from(VdmxGroup, record.entries));
        }

        const headerSize = frag.size + UInt16.size * numRatios;
        const groupPack = Frag.packMany(groups);
        for (const offset of groupPack.rootOffsets)
            frag.uint16(offset + headerSize);
        frag.bytes(groupPack.buffer);

        const numRecs = new Set(groupPack.rootOffsets).size;
        numRecsReserve.fill(numRecs);
    }
}
