// GVAR IUP optimizer
// The algorithm comes form:
//   - https://github.com/fonttools/fonttools/blob/master/Lib/fontTools/varLib/iup.py

import { ImpLib } from "@ot-builder/common-impl";

import { iup } from "../shared/iup";

// Can deltas between jPrev and jNext being interpolated by other points?
function canIupBetween(
    coords: ReadonlyArray<number>,
    deltas: ReadonlyArray<number>,
    n: number,
    dimensions: number,
    zPrev: number,
    zNext: number,
    tolerance: number
) {
    for (let dim = 0; dim < dimensions; dim++) {
        const zdPrev = ImpLib.Arith.d2(dimensions, ImpLib.Arith.pmod(zPrev, n), dim);
        const zdNext = ImpLib.Arith.d2(dimensions, ImpLib.Arith.pmod(zNext, n), dim);
        for (let zPoint = zPrev + 1; zPoint < zNext; zPoint++) {
            const zdPoint = ImpLib.Arith.d2(dimensions, ImpLib.Arith.pmod(zPoint, n), dim);

            const original = deltas[zdPoint];
            const interpolated = iup(
                ImpLib.Arith.Round.Coord(coords[zdPrev]),
                ImpLib.Arith.Round.Coord(coords[zdPoint]),
                ImpLib.Arith.Round.Coord(coords[zdNext]),
                ImpLib.Arith.Round.Coord(deltas[zdPrev]),
                ImpLib.Arith.Round.Coord(deltas[zdNext])
            );

            if (!ImpLib.Arith.Approx.equal(original, interpolated, tolerance)) return false;
        }
    }
    return true;
}

// The forced set is a conservative set of points on the contour that must be encoded
// explicitly(ie.cannot be interpolated).Calculating this set allows for significantly
// speeding up the dynamic-programming, as well as resolve circularity in DP.
//
// The set is precise; that is, if an index is in the returned set, then there is no way
// that IUP can generate delta for that point, given coords and delta.
function iupContourBoundForcedSet(
    coords: ReadonlyArray<number>,
    deltas: ReadonlyArray<number>,
    n: number,
    dimensions: number,
    tolerance: number
) {
    // Track "last" and "next" points on the contour as we sweep.
    let zN = 0,
        zL = n - 1;

    let forced: boolean[] = ImpLib.BitMask.Falses(n);

    for (let _zPoint = n - 1; _zPoint > -1; _zPoint--) {
        const zPoint = ImpLib.Arith.pmod(_zPoint, n);
        const z = zL;

        zL = ImpLib.Arith.pmod(_zPoint - 1, n);

        for (let dim = 0; dim < dimensions; dim++) {
            const cZ = ImpLib.Arith.Round.Coord(coords[ImpLib.Arith.d2(dimensions, z, dim)]);
            const dZ = deltas[ImpLib.Arith.d2(dimensions, z, dim)];
            const cL = ImpLib.Arith.Round.Coord(coords[ImpLib.Arith.d2(dimensions, zL, dim)]);
            const dL = ImpLib.Arith.Round.Coord(deltas[ImpLib.Arith.d2(dimensions, zL, dim)]);
            const cN = ImpLib.Arith.Round.Coord(coords[ImpLib.Arith.d2(dimensions, zN, dim)]);
            const dN = ImpLib.Arith.Round.Coord(deltas[ImpLib.Arith.d2(dimensions, zN, dim)]);

            let c1: number, c2: number, d1: number, d2: number;
            if (cL <= cN) {
                (c1 = cL), (c2 = cN), (d1 = dL), (d2 = dN);
            } else {
                (c1 = cN), (c2 = cL), (d1 = dN), (d2 = dL);
            }

            let force =
                roundCost(deltas, dimensions, z, tolerance) === COST_INTEGER &&
                pointIsForced(c1, cZ, c2, d1, dZ, d2, tolerance);

            if (force) forced[zPoint] = true;
        }

        zN = z;
    }

    return forced;
}

// Return if coordinate for current point is between coordinate of adjacent
// points on the two sides, but the delta for current point is NOT
// between delta for those adjacent points(considering tolerance
// allowance), then there is no way that current point can be IUP - ed.
// Mark it forced.
function pointIsForced(
    c1: number,
    cZ: number,
    c2: number,
    d1: number,
    dZ: number,
    d2: number,
    tolerance: number
) {
    if (c1 <= cZ && cZ <= c2) {
        return !ImpLib.Arith.Approx.between(d1, dZ, d2, tolerance);
    } else {
        if (c1 === c2) {
            if (d1 === d2) {
                return !ImpLib.Arith.Approx.equal(dZ, d1, tolerance);
            } else {
                return !ImpLib.Arith.Approx.zero(dZ, tolerance);
            }
        } else if (d1 !== d2) {
            if (cZ < c1) {
                return dZ !== d1 && dZ - tolerance < d1 !== d1 < d2;
            } else {
                return d2 !== dZ && d2 < dZ + tolerance !== d1 < d2;
            }
        }
    }
    return false;
}

// Use the loss function to avoid writing deltas which aren't integer -- typically
// it's read from an IUPed delta in a TTF.
const COST_INTEGER = 1;
const COST_NON_INTEGER = 1024;

function roundCost(
    deltas: ReadonlyArray<number>,
    dimensions: number,
    point: number,
    tolerance: number
) {
    let c = COST_INTEGER;
    for (let dim = 0; dim < dimensions; dim++) {
        const x = deltas[ImpLib.Arith.d2(dimensions, point, dim)];
        if (!ImpLib.Arith.Approx.equal(Math.round(x), x, tolerance)) c = COST_NON_INTEGER;
    }
    return c;
}

// Straightforward Dynamic-Programming.  For each index ptCur, find least-costly encoding of
// points 0 to ptCur where ptCur is explicitly encoded. We find this by considering all previous
// explicit points ptBef and check whether interpolation can fill points between ptBef and ptCur.
//
// Note that solution always encodes last point explicitly. Higher-level is responsible for
// removing that restriction.
//
// As major speedup, we stop looking further whenever we see a "forced" point.
function iupOptimizeDP(
    coords: ReadonlyArray<number>,
    deltas: ReadonlyArray<number>,
    n: number,
    dimensions: number,
    tolerance: number,
    forces: boolean[] = [],
    lookBack: number = n
) {
    let costs: number[] = [0]; // N + 1 items, [0] for a special terminating mask
    let chain: (number | null)[] = [null]; // N + 1 items, [0] for a special terminating mask

    for (let zCur = 0; zCur < n; zCur++) {
        const rc = roundCost(deltas, zCur, dimensions, tolerance);
        let bestCost = costs[zCur] + rc;
        costs[zCur + 1] = bestCost;
        chain[zCur + 1] = zCur > 0 ? zCur - 1 : null;
        if (forces[zCur - 1]) continue;

        for (let zBefore = zCur - 1; zBefore > -2 && zBefore > zCur - lookBack; zBefore--) {
            let cost = costs[zBefore + 1] + rc; // k + 1 always >= 0, so no overflow
            if (
                cost < bestCost &&
                canIupBetween(coords, deltas, n, dimensions, zBefore, zCur, tolerance)
            ) {
                costs[zCur + 1] = bestCost = cost;
                chain[zCur + 1] = zBefore;
            }
            if (forces[zBefore]) break;
        }
    }
    return { chain: chain.slice(1), costs: costs.slice(1) };
}

function rotateArray<T>(a: ReadonlyArray<T>, n: number, k: number): T[] {
    k = ImpLib.Arith.pmod(k, n);
    if (!k) return [...a];
    return [...a.slice(n - k), ...a.slice(0, n - k)];
}

function allDeltasSmall(deltas: ReadonlyArray<number>, tolerance: number) {
    for (const delta of deltas) if (!ImpLib.Arith.Approx.zero(delta, tolerance)) return false;
    return true;
}

function allDeltasSame(deltas: ReadonlyArray<number>, n: number, dimensions: number) {
    for (let dim = 0; dim < dimensions; dim++) {
        const d0 = deltas[ImpLib.Arith.d2(dimensions, 0, dim)];
        for (let ixPt = 1; ixPt < n; ixPt++) {
            const dj = deltas[ImpLib.Arith.d2(dimensions, ixPt, dim)];
            if (d0 !== dj) return false;
        }
    }
    return true;
}

function getMaxForce(n: number, forces: boolean[]) {
    for (let ixForce = n; ixForce-- > 0; ) {
        if (forces[ixForce]) return ixForce;
    }
    return n;
}

export function iupOptimize(
    dimensions: number, // Number of dimensions
    n: number, // Count of points in this contour
    coords: ReadonlyArray<number>, // N * Dimensions items of static coordinates
    deltas: ReadonlyArray<number>, // N * Dimensions items of deltas
    tolerance: number // Tolerance
): boolean[] {
    if (n <= dimensions) return ImpLib.BitMask.Trues(n);

    // If all are within tolerance distance of 0, encode nothing:
    if (allDeltasSmall(deltas, tolerance)) return ImpLib.BitMask.Falses(n);

    // If all deltas are exactly the same, return just one (the first one):
    if (allDeltasSame(deltas, n, dimensions)) {
        let solution = ImpLib.BitMask.Falses(n);
        solution[0] = true;
        return solution;
    }

    // Otherwise, solve the general problem using Dynamic Programming.

    const forces = iupContourBoundForcedSet(coords, deltas, n, dimensions, tolerance);

    // The iupOptimizeDP() routine returns the optimal encoding
    // solution given the constraint that the last point is always encoded.
    // To remove this constraint, we use two different methods, depending on
    // whether forced set is non-empty or not:

    const maxForce = getMaxForce(n, forces);
    if (maxForce < n) {
        // Forced set is non - empty: rotate the contour start point
        // such that the last point in the list is a forced point.
        const rot = n - 1 - maxForce;
        const deltas1 = rotateArray(deltas, dimensions * n, dimensions * rot);
        const coords1 = rotateArray(coords, dimensions * n, dimensions * rot);
        const forces1 = rotateArray(forces, n, rot);
        const { chain } = iupOptimizeDP(coords1, deltas1, n, dimensions, tolerance, forces1);
        let answer: boolean[] = ImpLib.BitMask.Falses(n);
        let jChain: number | null = n - 1;
        while (jChain !== null && jChain >= 0) {
            answer[ImpLib.Arith.pmod(jChain, n)] = true;
            jChain = chain[jChain];
        }

        return rotateArray(answer, n, -rot);
    } else {
        // Repeat the contour an extra time, solve the 2 * n case, then look for solutions of the
        // circular n - length problem in the solution for 2 * n linear case.I cannot prove that
        // this always produces the optimal solution...
        const { chain, costs } = iupOptimizeDP(
            [...coords, ...coords],
            [...deltas, ...deltas],
            2 * n,
            dimensions,
            tolerance,
            forces,
            n
        );

        let bestSolution: boolean[] = ImpLib.BitMask.Trues(n),
            bestCost = COST_NON_INTEGER * (n + 1);
        for (let start = n - 1; start < 2 * n - 1; start++) {
            let solution: boolean[] = ImpLib.BitMask.Falses(n);
            let cur: number | null = start;
            while (cur !== null && cur > start - n) {
                solution[ImpLib.Arith.pmod(cur, n)] = true;
                cur = chain[cur];
            }
            if (cur === start - n) {
                const cost = costs[start] - costs[start - n];
                if (cost < bestCost) {
                    bestSolution = solution;
                    bestCost = cost;
                }
            }
        }
        return bestSolution;
    }
}
