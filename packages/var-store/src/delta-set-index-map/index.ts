import { BinaryView, Read, Write } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { UIntN } from "@ot-builder/primitive";

export type IndexMapping = { outer: number; inner: number };
export interface IDeltaSetMappingSink {
    nMappingsNeeded: number;
    addMapping(gid: number, outerIndex: number, innerIndex: number): void;
}
export interface IDeltaSetMappingSinkWithFallback extends IDeltaSetMappingSink {
    addFallback(gid: number): void;
}

export const DeltaSetIndexMap = {
    ...Read((view: BinaryView, sink: IDeltaSetMappingSink) => {
        const format = view.uint8();
        const entryFormat = view.uint8();

        Assert.FormatSupported(`DeltaSetIndexMap`, format, 0, 1);
        const mapCount = format === 0 ? view.uint16() : view.uint32();

        let lastOuter = 0;
        let lastInner = 0;

        const innerIndexBitCount = 1 + (entryFormat & 0x000f);
        const innerIndexMask = (1 << innerIndexBitCount) - 1;
        const mapEntrySizeM1 = (entryFormat & 0x0030) >>> 4;

        for (let gid = 0; gid < mapCount; gid++) {
            const entry = view.next(UIntN[mapEntrySizeM1]);
            const outerIndex = entry >>> innerIndexBitCount;
            const innerIndex = entry & innerIndexMask;
            sink.addMapping(gid, outerIndex, innerIndex);
            lastOuter = outerIndex;
            lastInner = innerIndex;
        }
        for (let gid = mapCount; gid < sink.nMappingsNeeded; gid++) {
            sink.addMapping(gid, lastOuter, lastInner);
        }
    }),
    ...Write((frag, allowLongMapCount: boolean, source: IndexMapping[]) => {
        const mapCount = statMapCount(source);
        const { flag, bytesNeeded, bitsNeededInner } = getDeltaSetIndexFlags(source);

        const needsLongMapCount = mapCount > 0xffff;
        if (!allowLongMapCount && needsLongMapCount) {
            throw Errors.GeneralOverflow(
                `DeltaSetIndexMap mappings count that not allowing long count`,
                mapCount
            );
        }
        frag.uint8(needsLongMapCount ? 1 : 0);
        frag.uint8(flag);
        if (needsLongMapCount) {
            frag.uint32(mapCount);
        } else {
            frag.uint16(mapCount);
        }
        for (let gid = 0; gid < mapCount; gid++) {
            const { outer, inner } = source[gid];
            const entry = (outer << bitsNeededInner) | inner;
            frag.push(UIntN[bytesNeeded - 1], entry);
        }
    })
};

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

function getDeltaSetIndexFlags(m: IndexMapping[]) {
    let maxInnerIndex = 0,
        maxOuterIndex = 0;
    for (const { outer, inner } of m) {
        if (outer > maxOuterIndex) maxOuterIndex = outer;
        if (inner > maxInnerIndex) maxInnerIndex = inner;
    }
    let bitsNeededInner = 1,
        bitsNeededOuter = 1;
    while (bitsNeededInner <= 16 && 1 << bitsNeededInner <= maxInnerIndex) bitsNeededInner++;
    while (bitsNeededOuter <= 16 && 1 << bitsNeededOuter <= maxOuterIndex) bitsNeededOuter++;
    const bytesNeeded = Math.ceil((bitsNeededInner + bitsNeededOuter) / 8);
    const flag = (((bytesNeeded - 1) & 0x03) << 4) | ((bitsNeededInner - 1) & 0x0f);

    return { flag, bytesNeeded, bitsNeededOuter, bitsNeededInner };
}
