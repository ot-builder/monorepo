import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { MetricVariance } from "@ot-builder/ot-glyphs";
import { Maxp } from "@ot-builder/ot-metadata";
import { Data } from "@ot-builder/prelude";
import { UIntN } from "@ot-builder/primitive";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

type IndexMapping = { outer: number; inner: number };
type DeltaMapCallback = (gid: number, outer: number, inner: number) => void;
type DeltaMapFallbackCallback = (gid: number) => void;

function readDeltaMapping(
    pMapping: Data.Maybe<BinaryView>,
    needed: number,
    cbPresent: DeltaMapCallback,
    cbFallback?: Data.Maybe<DeltaMapFallbackCallback>
) {
    if (pMapping) {
        const entryFormat = pMapping.uint16();
        const mapCount = pMapping.uint16();
        let lastOuter = 0;
        let lastInner = 0;

        const innerIndexBitCount = 1 + (entryFormat & 0x000f);
        const innerIndexMask = (1 << innerIndexBitCount) - 1;
        const mapEntrySizeM1 = (entryFormat & 0x0030) >>> 4;

        for (let gid = 0; gid < mapCount; gid++) {
            const entry = pMapping.next(UIntN[mapEntrySizeM1]);
            const outerIndex = entry >>> innerIndexBitCount;
            const innerIndex = entry & innerIndexMask;
            cbPresent(gid, outerIndex, innerIndex);
            lastOuter = outerIndex;
            lastInner = innerIndex;
        }
        for (let gid = mapCount; gid < needed; gid++) {
            cbPresent(gid, lastOuter, lastInner);
        }
    } else if (cbFallback) {
        for (let gid = 0; gid < needed; gid++) {
            cbFallback(gid);
        }
    }
}

function statMapCount(map: IndexMapping[]) {
    let mapCount = map.length;
    while (mapCount > 2) {
        if (
            map[mapCount - 1].outer === map[mapCount - 2].outer &&
            map[mapCount - 1].inner === map[mapCount - 2].inner
        ) {
            mapCount--;
        } else {
            break;
        }
    }
    return mapCount;
}

function statFlag(map: IndexMapping[]) {
    let maxInnerIndex = 0,
        maxOuterIndex = 0;
    for (const { outer, inner } of map) {
        if (outer > maxOuterIndex) maxOuterIndex = outer;
        if (inner > maxInnerIndex) maxInnerIndex = inner;
    }
    let bitsNeededInner = 1,
        bitsNeededOuter = 1;
    while (bitsNeededInner <= 16 && 1 << bitsNeededInner <= maxInnerIndex) bitsNeededInner++;
    while (bitsNeededOuter <= 16 && 1 << bitsNeededOuter <= maxOuterIndex) bitsNeededOuter++;
    const bytesNeeded = Math.ceil((bitsNeededInner + bitsNeededOuter) / 8);
    const flag = (((bytesNeeded - 1) & 0x0003) << 4) | ((bitsNeededInner - 1) & 0x000f);

    return { flag, bytesNeeded, bitsNeededOuter, bitsNeededInner };
}

const DeltaMapping = Write((frag, map: IndexMapping[]) => {
    const mapCount = statMapCount(map);
    const { flag, bytesNeeded, bitsNeededInner } = statFlag(map);
    frag.uint16(flag);
    frag.uint16(mapCount);
    for (let gid = 0; gid < mapCount; gid++) {
        const { outer, inner } = map[gid];
        const entry = (outer << bitsNeededInner) | inner;
        frag.push(UIntN[bytesNeeded - 1], entry);
    }
});

export const MetricVarianceIo = {
    ...Read((view, maxp: Maxp.Table, designSpace: OtVar.DesignSpace, isVertical: boolean) => {
        const mv = new MetricVariance.Table(isVertical);
        for (let gid = 0; gid < maxp.numGlyphs; gid++) {
            mv.measures[gid] = new MetricVariance.Measure();
        }

        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("HMTX/VMTX", majorVersion, minorVersion, [1, 0]);

        const pIVS = view.ptr32();
        const ivs = pIVS.next(ReadTimeIVS, designSpace);

        // Mapping list
        const vAdvance = view.ptr32Nullable();
        readDeltaMapping(
            vAdvance,
            mv.measures.length,
            (gid, outer, inner) => (mv.measures[gid].advance = ivs.queryValue(outer, inner)),
            (gid: number) => (mv.measures[gid].advance = ivs.queryValue(0, gid))
        );

        // Skip, we don't need them.
        const vStartSB = view.ptr32Nullable();
        const vEndSB = view.ptr32Nullable();

        // Read VORG if necessary
        const vVorg = mv.isVertical ? view.ptr32Nullable() : null;
        readDeltaMapping(
            vVorg,
            mv.measures.length,
            (gid, outer, inner) => (mv.measures[gid].start = ivs.queryValue(outer, inner))
        );

        return mv;
    }),
    ...Write(
        (
            frag,
            mv: MetricVariance.Table,
            designSpace: OtVar.DesignSpace,
            pEmpty?: Data.Maybe<ImpLib.Access<boolean>>
        ) => {
            // No axes present in font, reject
            if (!designSpace.length) throw Errors.Variation.NoAxes();
            Assert.NoGap("HVAR/VVAR measures", mv.measures);

            const ms = new OtVar.MasterSet();
            const ivs = WriteTimeIVS.create(ms);
            const mFallback = new OtVar.Master([
                {
                    dim: designSpace.at(0),
                    min: 0,
                    peak: 1,
                    max: 1
                }
            ]);

            let empty = true;
            const advanceMap: IndexMapping[] = [];
            const originMap: IndexMapping[] = [];
            for (let gid = 0; gid < mv.measures.length; gid++) {
                if (!OtVar.Ops.isConstant(mv.measures[gid].advance)) empty = false;
                advanceMap[gid] = ivs.valueToInnerOuterIDForce(
                    mv.measures[gid].advance,
                    mFallback
                );
            }
            if (mv.isVertical) {
                for (let gid = 0; gid < mv.measures.length; gid++) {
                    if (!OtVar.Ops.isConstant(mv.measures[gid].start)) empty = false;
                    originMap[gid] = ivs.valueToInnerOuterIDForce(
                        mv.measures[gid].start,
                        mFallback
                    );
                }
            }

            if (pEmpty) pEmpty.set(empty);

            frag.uint16(1).uint16(0); // Format
            frag.ptr32(Frag.from(WriteTimeIVS, ivs, designSpace)); // itemVariationStoreOffset
            frag.ptr32(Frag.from(DeltaMapping, advanceMap)); // Advance mappings
            frag.ptr32(null); // LSB/RSB/TSB/BSB mappings are always set to empty
            frag.ptr32(null); // due to the limitation of OTVAR variation (no min/max functions)
            if (mv.isVertical) frag.ptr32(Frag.from(DeltaMapping, originMap)); // VORG mappings
        }
    )
};
