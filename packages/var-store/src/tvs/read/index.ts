import { BinaryView, Read } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Arith, Control, Data } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { TvhFlags, TvhSetFlags } from "../shared/flags";
import { inferDeltas, TvdAccess } from "../shared/iup";
import { DeltaRun, PointCount, PointNumberRun } from "../shared/runs";

export interface TupleVariationSource {
    readonly axes: Data.Order<OtVar.Axis>;
    readonly sharedTuples: ReadonlyArray<ReadonlyArray<number>>;
}

export interface TupleVariationGeometryClient {
    readonly dimensions: number;
    readonly contours: TvdAccess<OtVar.Master>[][];
    finish(): void;
}

interface TupleVarHeader {
    master: OtVar.Master;
    variationDataSize: number;
    hasPrivatePoints: boolean;
}

export const TupleVariationRead = Read(
    (view: BinaryView, client: TupleVariationGeometryClient, vsr: TupleVariationSource) => {
        const dimensions = client.dimensions;
        let totalPoints = 0;
        for (const c of client.contours) totalPoints += Arith.rowCount(c, client.dimensions);

        const _tupleVariationCount = view.uint16();
        const vwData = view.ptr16();

        const tvhList: TupleVarHeader[] = [];
        for (let ixTvh = 0; ixTvh < (_tupleVariationCount & TvhSetFlags.COUNT_MASK); ixTvh++) {
            tvhList.push(view.next(TupleVariationHeader, vsr));
        }

        let sharedPoints = null;
        if (_tupleVariationCount & TvhSetFlags.SHARED_POINT_NUMBERS) {
            sharedPoints = vwData.next(PointNumbers, totalPoints);
        }

        const vwPrivateData = vwData.liftRelative(0);
        let startByte = 0;
        for (const tvh of tvhList) {
            const vwTvd = vwPrivateData.lift(startByte);
            let points = null;
            if (tvh.hasPrivatePoints) {
                points = vwTvd.next(PointNumbers, totalPoints);
            } else {
                points = sharedPoints;
            }
            if (!points) throw Errors.Variation.MissingPoints();

            for (let d = 0; d < dimensions; d++) {
                const deltas = vwTvd.next(Deltas, points);
                // const cf = client.contours.map(c => c.map(x => x[d].original));
                // console.log(`${cf}\n${deltas.filter(x => x != null)}\n${points}`);
                inferDeltas(dimensions, d, client.contours, tvh.master, deltas);
            }
            startByte += tvh.variationDataSize;
        }

        return client.finish();
    }
);

const TupleVariationHeader = Read((view: BinaryView, vsr: TupleVariationSource) => {
    const variationDataSize = view.uint16();
    const _tupleIndex = view.uint16();

    const peakTuple =
        _tupleIndex & TvhFlags.EMBEDDED_PEAK_TUPLE
            ? view.array(vsr.axes.length, F2D14)
            : vsr.sharedTuples[_tupleIndex & TvhFlags.TUPLE_INDEX_MASK];
    if (!peakTuple) {
        throw Errors.Variation.MissingPeakTuple();
    }
    const startTuple =
        _tupleIndex & TvhFlags.INTERMEDIATE_REGION ? view.array(vsr.axes.length, F2D14) : null;
    const endTuple =
        _tupleIndex & TvhFlags.INTERMEDIATE_REGION ? view.array(vsr.axes.length, F2D14) : null;

    const spans: OtVar.MasterDim[] = [];
    for (let aid = 0; aid < vsr.axes.length; aid++) {
        const axis = vsr.axes.at(aid);
        const p = peakTuple[aid];
        const mDim: OtVar.MasterDim =
            startTuple && endTuple
                ? { axis, min: startTuple[aid], peak: p, max: endTuple[aid] }
                : OtVar.MasterDim.fromPeak(axis, p);
        spans.push(mDim);
    }
    return {
        master: new OtVar.Master(spans),
        variationDataSize,
        hasPrivatePoints: !!(_tupleIndex & TvhFlags.PRIVATE_POINT_NUMBERS)
    };
});

const PointNumbers = Read((view: BinaryView, nPoints: number) => {
    const pointCount = view.next(PointCount);
    if (pointCount == null) return [...Control.Iota(0, nPoints)];

    let currentPoint = 0;
    let points: number[] = [];
    while (points.length < pointCount) {
        currentPoint = view.next(PointNumberRun, currentPoint, points);
    }
    return points;
});

const Deltas = Read((view: BinaryView, points: number[]) => {
    let deltasParsed = 0;
    let deltas: number[] = [];
    while (deltasParsed < points.length) {
        deltasParsed = view.next(DeltaRun, deltasParsed, points, deltas);
    }
    return deltas;
});
