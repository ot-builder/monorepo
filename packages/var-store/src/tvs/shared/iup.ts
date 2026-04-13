import * as ImpLib from "@ot-builder/common-impl";

export interface TvdAccess<M> {
    readonly original: number;
    addDelta(master: M, delta: number): void;
    finish(): void;
}

// Per algorithm described at : https://bit.ly/2ZFT1QD
function iupImpl(
    belowCoord: number,
    targetCoord: number,
    aboveCoord: number,
    belowDelta: number,
    aboveDelta: number
) {
    if (belowCoord === aboveCoord) {
        if (belowDelta === aboveDelta) return belowDelta;
        else return 0;
    } else {
        if (targetCoord <= belowCoord) {
            return belowDelta;
        } else if (targetCoord >= aboveCoord) {
            return aboveDelta;
        } else {
            const scale = (targetCoord - belowCoord) / (aboveCoord - belowCoord);
            return belowDelta + (aboveDelta - belowDelta) * scale;
        }
    }
}

export function iup(
    preCoord: number,
    targetCoord: number,
    followCoord: number,
    preDelta: number,
    followDelta: number
) {
    if (preCoord <= followCoord) {
        return iupImpl(preCoord, targetCoord, followCoord, preDelta, followDelta);
    } else {
        return iupImpl(followCoord, targetCoord, preCoord, followDelta, preDelta);
    }
}

function incMod(x: number, n: number) {
    return (x + 1) % n;
}

export function iupContour<M>(
    dimensions: number,
    dim: number,
    start: number,
    contour: TvdAccess<M>[],
    master: M,
    deltas: (number | undefined)[]
) {
    let ixPoint = 0;
    const n = ImpLib.Arith.rowCount(contour, dimensions);
    while (ixPoint < n && deltas[start + ixPoint] === undefined) ixPoint++;
    if (ixPoint >= n) return;
    const firstDelta = ixPoint;
    let prevDelta = ixPoint;
    contour[ImpLib.Arith.d2(dimensions, firstDelta, dim)].addDelta(
        master,
        deltas[start + firstDelta]!
    );

    ixPoint = incMod(ixPoint, n);
    while (ixPoint % n !== firstDelta) {
        if (deltas[start + ixPoint] !== undefined) {
            fillThisGap(dimensions, dim, n, start, prevDelta, ixPoint, contour, master, deltas);
            prevDelta = ixPoint;
            contour[ImpLib.Arith.d2(dimensions, prevDelta, dim)].addDelta(
                master,
                deltas[start + prevDelta]!
            );
        }
        ixPoint = incMod(ixPoint, n);
    }

    fillThisGap(dimensions, dim, n, start, prevDelta, ixPoint, contour, master, deltas);
}

function fillThisGap<M>(
    dimensions: number,
    dim: number,
    n: number,
    start: number,
    begin: number,
    end: number,
    contour: TvdAccess<M>[],
    master: M,
    deltas: (number | undefined)[]
) {
    for (let ixMiddle = incMod(begin, n); ixMiddle !== end; ixMiddle = incMod(ixMiddle, n)) {
        const delta = iup(
            contour[ImpLib.Arith.d2(dimensions, begin, dim)].original,
            contour[ImpLib.Arith.d2(dimensions, ixMiddle, dim)].original,
            contour[ImpLib.Arith.d2(dimensions, end, dim)].original,
            deltas[start + begin]!,
            deltas[start + end]!
        );
        contour[ImpLib.Arith.d2(dimensions, ixMiddle, dim)].addDelta(master, delta);
    }
}

export function inferDeltas<M>(
    dimensions: number,
    dim: number,
    contours: TvdAccess<M>[][],
    master: M,
    deltas: (number | undefined)[]
) {
    let start = 0;
    for (let ixContour = 0; ixContour < contours.length; ixContour++) {
        const contour = contours[ixContour];
        iupContour(dimensions, dim, start, contour, master, deltas);
        start += ImpLib.Arith.rowCount(contour, dimensions);
    }
}
