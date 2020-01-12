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
            ivs.knownMasters.push(OtVar.Create.Master(spans));
        }
    }),
    ...Write((fr, regions: ReadonlyArray<OtVar.Master>, ds: OtVar.DesignSpace) => {
        fr.uint16(ds.length); // axesCount
        fr.uint16(regions.length);
        for (const region of ImpLib.Iterators.ToCount(
            regions,
            regions.length,
            OtVar.Create.Master([])
        )) {
            const m: Map<OtVar.Dim, OtVar.MasterDim> = new Map();
            for (const dim of region.regions) {
                m.set(dim.dim, dim);
            }
            for (const dim of ds) {
                const mDim = m.get(dim);
                fr.array(F2D14, [mDim ? mDim.min : -1, mDim ? mDim.peak : 0, mDim ? mDim.max : 1]);
            }
        }
    })
};

const IVD = {
    ...Read(vw => {
        const ivd = new ReadTimeIVD(OtVar.Create.ValueFactory(OtVar.Create.MasterSet()));
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
        const regionIndexCount = ivd.masterIDs.length;
        let shortDeltaCount = 0;

        const deltaMatrix: number[][] = [];

        for (const [deltas, innerID] of ivd.entries()) {
            for (let mid = shortDeltaCount; mid < regionIndexCount; mid++) {
                const delta = deltas[mid] || 0;
                if (Int8.from(delta) !== delta) shortDeltaCount = mid + 1;
            }
            deltaMatrix[innerID] = [...deltas];
        }

        fr.uint16(deltaMatrix.length);
        fr.uint16(shortDeltaCount);
        fr.uint16(regionIndexCount);
        fr.arrayNF(UInt16, regionIndexCount, ivd.masterIDs, 0);
        for (const deltas of ImpLib.Iterators.ToCount(deltaMatrix, deltaMatrix.length, [])) {
            for (const [delta, dim] of ImpLib.Iterators.ToCountIndex(
                deltas,
                regionIndexCount,
                0
            )) {
                if (dim < shortDeltaCount) fr.int16(delta);
                else fr.int8(delta);
            }
        }
    })
};

export type ReadTimeIVS = CReadTimeIVS<OtVar.Dim, OtVar.Master, OtVar.Value>;
export const ReadTimeIVS = {
    Create() {
        return new CReadTimeIVS<OtVar.Dim, OtVar.Master, OtVar.Value>();
    },
    ...Read((vw, designSpace: OtVar.DesignSpace) => {
        const format = vw.uint16();
        if (format !== 1) throw Errors.FormatNotSupported("IVS", format);

        const ivs = new CReadTimeIVS<OtVar.Dim, OtVar.Master, OtVar.Value>();

        const pRegionList = vw.ptr32();
        pRegionList.next(RegionList, designSpace, ivs);

        const ivdCount = vw.uint16();
        for (const [pIVDOffset] of vw.repeat(ivdCount)) {
            const pIVD = pIVDOffset.ptr32();
            ivs.itemVariationData.push(pIVD.next(IVD));
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
