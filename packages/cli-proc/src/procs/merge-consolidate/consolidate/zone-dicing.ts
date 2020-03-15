export type Span = [number, number];
export type Zone = Span[];
export type SrcZone<S> = [Zone, S];
export type DstZone<S> = [Zone, S[]];

export function* diceZones<S>(dn: number, zoneSets: SrcZone<S>[]): IterableIterator<DstZone<S>> {
    if (!zoneSets.length) return;

    let dicingResults: Map<string, Zone> = new Map();
    dicingResults.set(hashZone(zoneSets[0][0]), zoneSets[0][0]);

    for (let z = 1; z < zoneSets.length; z++) {
        const updatedResults: Map<string, Zone> = new Map();
        for (const oldZone of dicingResults.values()) {
            for (const newZone of diceTwoZones(dn, oldZone, zoneSets[z][0])) {
                const zone = copyZone(newZone);
                const zh = hashZone(zone);
                updatedResults.set(zh, zone);
            }
        }
        dicingResults = updatedResults;
    }

    for (const zone of dicingResults.values()) {
        const matchingSSet: S[] = [];
        for (const [srcZone, s] of zoneSets) {
            let inZone = true;
            for (let d = 0; d < srcZone.length; d += 1) {
                if (zone[d][0] < srcZone[d][0] || zone[d][1] > srcZone[d][1]) {
                    inZone = false;
                    break;
                }
            }
            if (inZone) matchingSSet.push(s);
        }
        yield [zone, matchingSSet];
    }
}

export function hashZone(zone: Zone) {
    let result = "";
    for (let d = 0; d < zone.length; d++) {
        result += `${zone[d][0]};${zone[d][1]}/`;
    }
    return result;
}

function copyZone(x: Zone) {
    const result: Zone = [];
    for (let d = 0; d < x.length; d++) result[d] = [x[d][0], x[d][1]];
    return result;
}

function* diceTwoZones<D>(dimCount: number, condSet1: Zone, condSet2: Zone) {
    if (dimCount <= 0) return;
    const telescope: Zone = [];
    for (let d = 0; d < dimCount; d++) telescope[d] = [0, 0];
    yield* diceTwoZonesImpl(dimCount, 0, 3, telescope, condSet1, condSet2);
}

function* diceTwoZonesImpl(
    dn: number,
    d: number,
    carry: number,
    result: Zone,
    zone1: Zone,
    zone2: Zone
): IterableIterator<Zone> {
    if (!carry) return;
    if (d >= dn) {
        yield result;
        return;
    }
    if (carry === 1) {
        yield* stopDicing(dn, d, result, zone1);
        return;
    }
    if (carry === 2) {
        yield* stopDicing(dn, d, result, zone2);
        return;
    }

    const span1 = zone1[d];
    const span2 = zone2[d];
    for (const mask of dimMask(d, result, span1, span2))
        yield* diceTwoZonesImpl(dn, d + 1, carry & mask, result, zone1, zone2);
}

function* stopDicing(dn: number, d: number, result: Zone, zone: Zone): IterableIterator<Zone> {
    for (let dd = d; dd < dn; dd++) {
        result[dd][0] = zone[dd][0];
        result[dd][1] = zone[dd][1];
    }
    yield result;
}

function* dimMask(d: number, result: Zone, span1: Span, span2: Span) {
    if (span1[0] <= span2[0]) {
        yield* dimMaskImpl(d, result, span1, span2, 1, 2);
    } else {
        yield* dimMaskImpl(d, result, span2, span1, 2, 1);
    }
}

function* dimMaskImpl(
    d: number,
    result: Zone,
    span1: Span,
    span2: Span,
    one: number,
    two: number
) {
    if (span1[1] <= span2[0]) {
        if (withLen(d, result, span1[0], span1[1])) yield one;
        if (withLen(d, result, span2[0], span2[1])) yield two;
    } else if (span1[1] <= span2[1]) {
        // [  {  ]  }
        if (withLen(d, result, span1[0], span2[0])) yield one;
        if (withLen(d, result, span2[0], span1[1])) yield one | two;
        if (withLen(d, result, span1[1], span2[1])) yield two;
    } else {
        // [  {  }  ]
        if (withLen(d, result, span1[0], span2[0])) yield one;
        if (withLen(d, result, span2[0], span2[1])) yield one | two;
        if (withLen(d, result, span2[1], span1[1])) yield one;
    }
}

function withLen(d: number, result: Zone, min: number, max: number) {
    if (max > min) {
        result[d][0] = min;
        result[d][1] = max;
        return true;
    } else {
        return false;
    }
}
