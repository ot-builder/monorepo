import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { F2D14, Int8, UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import {
    CReadTimeIVS,
    DelayDeltaValue,
    GeneralWriteTimeIVStore,
    ReadTimeIVD,
    WriteTimeIVD
} from "./general";

const RegionList = {
    ...Read((vw: BinaryView, designSpace: OtVar.DesignSpace, ivs: ReadTimeIVS) => {
        const axisCount = vw.uint16();
        Assert.Variation.AxesCountMatch(
            "IVS::VariationRegionList::axisCount",
            axisCount,
            "fvar::axisCount",
            designSpace.length
        );
        const regionCount = vw.uint16();

        for (const [pRegion] of vw.repeat(regionCount)) {
            const spans: OtVar.MasterDim[] = [];
            for (const [pAxis, axisIndex] of pRegion.repeat(axisCount)) {
                const min = pAxis.next(F2D14);
                const peak = pAxis.next(F2D14);
                const max = pAxis.next(F2D14);
                spans.push({ dim: designSpace.at(axisIndex), min, peak, max });
            }
            ivs.knownMasters.push(new OtVar.Master(spans));
        }
    }),
    ...Write((fr, regions: ReadonlyArray<OtVar.Master>, ds: OtVar.DesignSpace) => {
        Assert.NotOverflow("VariationRegionList::regionCount", regions.length, 0x7fff);
        fr.uint16(ds.length); // axesCount
        fr.uint16(regions.length); // regionCount
        for (const region of ImpLib.Iterators.ArrToCount(regions, new OtVar.Master([]))) {
            const m: Map<OtVar.Dim, OtVar.MasterDim> = new Map();
            for (const dim of region.regions) {
                m.set(dim.dim, dim);
            }
            for (const dim of ds) {
                const mDim = m.get(dim);
                fr.array(F2D14, mDim ? [mDim.min, mDim.peak, mDim.max] : [-1, 0, 1]);
            }
        }
    })
};

function createIVD() {
    return new ReadTimeIVD(new OtVar.ValueFactory(new OtVar.MasterSet()));
}
function createIVS() {
    return new CReadTimeIVS<OtVar.Dim, OtVar.Master, OtVar.Value>(OtVar.Ops);
}

const IVD = {
    ...Read(vw => {
        const ivd = createIVD();
        const itemCount = vw.uint16();
        const shortDeltaCount = vw.uint16();
        const regionIndexCount = vw.uint16();
        for (const [p, index] of vw.repeat(regionIndexCount)) {
            ivd.masterIDs[index] = p.uint16();
        }
        for (const [p, jItem] of vw.repeat(itemCount)) {
            const deltas = [];
            for (let jDelta = 0; jDelta < regionIndexCount; jDelta++) {
                if (jDelta < shortDeltaCount) deltas[jDelta] = p.int16();
                else deltas[jDelta] = p.int8();
            }
            ivd.deltas[jItem] = deltas;
        }
        return ivd;
    }),
    ...Write((fr, ivd: WriteTimeIVD) => {
        const regionCount = ivd.masterIDs.length;
        let shortDeltaCount = 0;

        const deltas: number[][] = [];
        for (const [deltaRow, innerID] of ivd.entries()) {
            for (let mid = shortDeltaCount; mid < regionCount; mid++) {
                const delta = deltaRow[mid] || 0;
                if (Int8.from(delta) !== delta) shortDeltaCount = mid + 1;
            }
            deltas[innerID] = [...deltaRow];
        }

        fr.uint16(deltas.length);
        fr.uint16(shortDeltaCount);
        fr.uint16(regionCount);
        fr.arrayNF(UInt16, regionCount, ivd.masterIDs, 0);
        for (const [delta, , dim] of ImpLib.Iterators.FlatMatrixSized(deltas, regionCount, 0)) {
            if (dim < shortDeltaCount) fr.int16(delta);
            else fr.int8(delta);
        }
    })
};

export type ReadTimeIVS = CReadTimeIVS<OtVar.Dim, OtVar.Master, OtVar.Value>;
export const ReadTimeIVS = {
    Create: createIVS,
    ...Read((vw, designSpace: OtVar.DesignSpace) => {
        const format = vw.uint16();
        if (format !== 1) throw Errors.FormatNotSupported("IVS", format);

        const ivs = createIVS();

        const pRegionList = vw.ptr32();
        pRegionList.next(RegionList, designSpace, ivs);

        const ivdCount = vw.uint16();
        for (const [pIVDOffset] of vw.repeat(ivdCount)) {
            const pIVD = pIVDOffset.ptr32Nullable();
            if (pIVD) {
                ivs.itemVariationData.push(pIVD.next(IVD));
            } else {
                ivs.itemVariationData.push(createIVD());
            }
        }

        return ivs;
    })
};

export type WriteTimeDelayValue = DelayDeltaValue<OtVar.Dim, OtVar.Master, OtVar.Value>;

export type WriteTimeIVS = GeneralWriteTimeIVStore<OtVar.Dim, OtVar.Master, OtVar.Value>;
export const WriteTimeIVS = {
    create(ms: OtVar.MasterSet) {
        return new GeneralWriteTimeIVStore(OtVar.Ops, ms, 0xfff0);
    },
    ...Write((frag, ivs: WriteTimeIVS, designSpace: OtVar.DesignSpace) => {
        const masterList: OtVar.Master[] = [];
        for (const [m, id] of ivs.masters()) masterList[id] = m;

        const fr = new Frag();
        fr.uint16(1);
        fr.ptr32New().push(RegionList, masterList, designSpace);
        const ivdList = [...ivs.ivdList()];
        fr.uint16(ivdList.length);
        for (const ivd of ivdList) {
            fr.ptr32New().push(IVD, ivd);
        }

        frag.bytes(Frag.pack(fr));
    })
};
