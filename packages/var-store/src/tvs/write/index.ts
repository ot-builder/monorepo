import { Frag, Write, WriteOpt } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Data } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { TvhFlags, TvhSetFlags } from "../shared/flags";
import { DeltaRunDp, PointCount, PointNumberRunDp } from "../shared/runs";

import { collectDeltaData, DelayDeltaValue, TvsCollector } from "./collect";
import { iupOptimize } from "./iup-optimize";
import { MasterToTupleConverter, TupleAllocator } from "./tuple-allocator";

export interface TupleVariationBuildContext {
    readonly axes: Data.Order<OtVar.Axis>;
    readonly tupleAllocator?: TupleAllocator;
    readonly forceEmbedPeak?: boolean;
    readonly forceIntermediate?: boolean;
    readonly forcePrivatePointNumbers?: boolean;
    readonly iupTolerance?: number; // GVAR optimization
}
export interface TupleVariationBuildSource {
    readonly dimensions: number;
    readonly data: OtVar.Value[][];
}

export const TupleVariationWriteOpt = WriteOpt(
    (source: TupleVariationBuildSource, ctx: TupleVariationBuildContext) => {
        const col = new TvsCollector(new OtVar.MasterSet());
        const data = collectDeltaData(col, source.dimensions, source.data);
        const tuc = new MasterToTupleConverter(ctx.axes, !!ctx.forceIntermediate);

        const knownMasters: [number, OtVar.Master][] = col.getMasterList();
        if (!knownMasters.length) return null;
        if (knownMasters.length > TvhSetFlags.COUNT_MASK) throw Errors.Variation.TooManyMasters();

        let blobResults: BlobWriteResult[] = [];
        for (const [mid, master] of knownMasters) {
            blobResults.push(writeBlob(source, ctx, tuc, data, mid, master));
        }

        // Write the frag
        const frRoot = new Frag();
        const frData = new Frag();
        // - Header
        const fHaveSharedPoints =
            !ctx.forcePrivatePointNumbers &&
            !ImpLib.BitMask.allTrue(blobResults.map(x => x.embedPointIndex))
                ? TvhSetFlags.SHARED_POINT_NUMBERS
                : 0;
        frRoot.uint16(fHaveSharedPoints | blobResults.length);
        frRoot.ptr16(frData);
        // - Shared point numbers
        if (fHaveSharedPoints) frData.push(AllPoints, undefined);
        // - Data
        for (const result of blobResults) {
            frData.bytes(result.bufBody);
            frRoot.uint16(result.bufBody.byteLength).bytes(result.bufHeader);
        }

        return frRoot;
    }
);

interface BlobWriteResult {
    embedPointIndex: boolean;
    hasNonIntegerDelta: boolean;
    bufHeader: Buffer;
    bufBody: Buffer;
}
function writeBlob(
    source: TupleVariationBuildSource,
    ctx: TupleVariationBuildContext,
    tuc: MasterToTupleConverter,
    data: DelayDeltaValue[][],
    mid: number,
    master: OtVar.Master
): BlobWriteResult {
    let result = writeBlobImpl(source, ctx, tuc, data, mid, master, 0);
    if (ctx.iupTolerance) {
        let resOpt = writeBlobImpl(source, ctx, tuc, data, mid, master, ctx.iupTolerance);
        if (
            (resOpt.bufBody.byteLength <= result.bufBody.byteLength || result.hasNonIntegerDelta) &&
            !resOpt.hasNonIntegerDelta
        ) {
            result = resOpt;
        }
    }
    // if (result.hasNonIntegerDelta) process.stderr.write("Non-integer delta recorded\n");
    return result;
}
function writeBlobImpl(
    source: TupleVariationBuildSource,
    ctx: TupleVariationBuildContext,
    tuc: MasterToTupleConverter,
    data: DelayDeltaValue[][],
    mid: number,
    master: OtVar.Master,
    tolerance: number
): BlobWriteResult {
    const frBody = new Frag();

    const { n, mask, deltas, hasNonIntegerDelta } = decidePointsAndDeltas(
        source,
        data,
        mid,
        tolerance
    );
    if (ImpLib.BitMask.allFalseN(n, mask)) mask[0] = true;
    const embedPointIndex = ctx.forcePrivatePointNumbers || !ImpLib.BitMask.allTrueN(n, mask);
    const hr = writeTupleVariationHeader(ctx, tuc, master, embedPointIndex);

    if (hr.fPrivatePoints) frBody.push(PointsMask, n, mask);
    for (let dim = 0; dim < source.dimensions; dim++) {
        frBody.push(DeltaRuns, deltas, mask, source.dimensions, dim);
    }

    return {
        embedPointIndex,
        hasNonIntegerDelta,
        bufHeader: Frag.pack(hr.frag),
        bufBody: Frag.pack(frBody)
    };
}

function logChoices(dimensions: number, coords: number[], deltas: number[], mask: boolean[]) {
    let s = "";
    for (let z = 0; z < mask.length; z++) {
        let r = "";
        for (let dim = 0; dim < dimensions; dim++) {
            const delta = deltas[ImpLib.Arith.d2(dimensions, z, dim)];
            r +=
                (dim ? " " : "") +
                coords[ImpLib.Arith.d2(dimensions, z, dim)] +
                (delta >= 0 ? "+" : "") +
                delta;
        }

        if (mask[z]) {
            r = `\u001b[32m${r}\u001b[0m`;
        }
        s += (z ? "," : "") + r;
    }
    process.stderr.write(s + "\n");
}

function decidePointsAndDeltas(
    source: TupleVariationBuildSource,
    data: DelayDeltaValue[][],
    mid: number,
    tolerance: number
) {
    let mask: boolean[] = [];
    let deltas: number[] = [];
    let coords: number[] = [];
    let hasNonIntegerDelta = false;
    for (let cid = 0; cid < data.length; cid++) {
        const contourCoords: number[] = [];
        const contourDeltas: number[] = [];
        for (const dd of data[cid]) {
            contourCoords.push(dd.origin || 0);
            contourDeltas.push(dd.resolve()[mid] || 0);
        }
        const n = ImpLib.Arith.rowCount(contourCoords, source.dimensions);
        const counterMask = tolerance
            ? iupOptimize(source.dimensions, n, contourCoords, contourDeltas, tolerance)
            : ImpLib.BitMask.Trues(n);
        for (let zid = 0; zid < n; zid++) {
            mask.push(!!counterMask[zid]);
            if (counterMask[zid]) {
                for (let dim = 0; dim < source.dimensions; dim++) {
                    let delta = contourDeltas[ImpLib.Arith.d2(source.dimensions, zid, dim)];
                    if (Math.round(delta) !== delta) hasNonIntegerDelta = true;
                }
            }
        }
        for (const d of contourDeltas) deltas.push(d);
        for (const d of contourCoords) coords.push(d);
    }
    // if (hasNonIntegerDelta) {
    //     logChoices(source.dimensions, coords, deltas, mask);
    // }
    return { n: mask.length, mask, deltas, hasNonIntegerDelta };
}

function writeTupleVariationHeader(
    ctx: TupleVariationBuildContext,
    tuc: MasterToTupleConverter,
    master: OtVar.Master,
    embedPointIndex: boolean
) {
    const frag = new Frag();
    const { min, peak, max } = tuc.getTuples(master);
    const { fEmbedPeak, peakTupleID } = tryEmbedPeakTuple(ctx, peak);
    const fIntermediate = ctx.forceIntermediate || min || max ? TvhFlags.INTERMEDIATE_REGION : 0;
    const fPrivatePoints = embedPointIndex ? TvhFlags.PRIVATE_POINT_NUMBERS : 0;

    frag.uint16(fPrivatePoints | fEmbedPeak | fIntermediate | peakTupleID);
    if (fEmbedPeak) frag.arrayN(F2D14, ctx.axes.length, peak);
    if (fIntermediate) frag.arrayN(F2D14, ctx.axes.length, min!);
    if (fIntermediate) frag.arrayN(F2D14, ctx.axes.length, max!);

    return { frag, fPrivatePoints };
}

function tryEmbedPeakTuple(ctx: TupleVariationBuildContext, peak: number[]) {
    let peakTupleID = 0;
    let fEmbedPeak = ctx.forceEmbedPeak ? TvhFlags.EMBEDDED_PEAK_TUPLE : 0;
    if (!fEmbedPeak) {
        if (!ctx.tupleAllocator) throw Errors.Unreachable();
        peakTupleID = ctx.tupleAllocator.allocate(peak).index;
        if (peakTupleID > TvhFlags.TUPLE_INDEX_MASK) {
            fEmbedPeak |= TvhFlags.EMBEDDED_PEAK_TUPLE;
            peakTupleID = 0;
        }
    }
    return { fEmbedPeak, peakTupleID };
}

const DeltaRuns = Write(
    (frag: Frag, deltas: number[], mask: boolean[], dimensions: number, dim: number) => {
        const dp = new DeltaRunDp.Writer(3);
        for (let ixDelta = dim, zid = 0; ixDelta < deltas.length; ixDelta += dimensions, zid++) {
            const delta = deltas[ixDelta];
            if (mask[zid]) dp.update(ImpLib.Arith.Round.Coord(delta));
        }
        dp.write(frag);
    }
);

const AllPoints = Write(frag => frag.uint8(0));
const PointsMask = Write((frag: Frag, n: number, mask: boolean[]) => {
    if (ImpLib.BitMask.allTrueN(n, mask)) {
        frag.uint8(0);
        return;
    } else {
        const dp = new PointNumberRunDp.Writer(3);
        let points = 0;
        let last = 0;
        for (let zid = 0; zid < n; zid++) {
            if (mask[zid]) {
                dp.update(zid - last);
                points++;
                last = zid;
            }
        }
        frag.push(PointCount, points);
        dp.write(frag);
    }
});
