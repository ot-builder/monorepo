export type Span = [number, number];
export type Zone = Span[];
export type SrcZone<S> = [Zone, S];
export type DstZone<S> = [Zone, S[]];

export function* diceZones<S>(dn: number, zoneSets: SrcZone<S>[]): IterableIterator<DstZone<S>> {
    if (!zoneSets.length) return;
    yield* scanPlaneDiceZones(dn, 0, [], zoneSets);
}

function* scanPlaneDiceZones<S>(
    dn: number,
    d: number,
    carry: Zone,
    zones: SrcZone<S>[]
): IterableIterator<DstZone<S>> {
    if (d >= dn) {
        yield fetchMatchingSs(carry, zones);
        return;
    }

    const stops = new Set<number>();
    for (const [zone] of zones) {
        let shouldInclude = true;
        for (let dt = 0; dt < d; dt++) {
            const spanZone = zone[dt];
            const spanCarry = carry[dt];
            if (spanCarry[0] < spanZone[0] || spanCarry[1] > spanZone[1]) {
                shouldInclude = false;
                break;
            }
        }
        if (shouldInclude) stops.add(zone[d][0]), stops.add(zone[d][1]);
    }

    const sortedStops = Array.from(stops).sort(asc);

    for (let s = 1; s < sortedStops.length; s++) {
        carry[d] = [sortedStops[s - 1], sortedStops[s]];
        yield* scanPlaneDiceZones(dn, d + 1, carry, zones);
    }
}

function fetchMatchingSs<S>(carry: Zone, zones: SrcZone<S>[]): DstZone<S> {
    const matchingSSet: S[] = [];
    for (const [srcZone, s] of zones) {
        let inZone = true;
        for (let d = 0; d < srcZone.length; d += 1) {
            if (carry[d][0] < srcZone[d][0] || carry[d][1] > srcZone[d][1]) {
                inZone = false;
                break;
            }
        }
        if (inZone) matchingSSet.push(s);
    }

    return [carry.slice(0), matchingSSet];
}

function asc(a: number, b: number) {
    return a - b;
}

export function hashZone(zone: Zone) {
    let result = "";
    for (let d = 0; d < zone.length; d++) {
        result += `${zone[d][0]};${zone[d][1]}/`;
    }
    return result;
}
