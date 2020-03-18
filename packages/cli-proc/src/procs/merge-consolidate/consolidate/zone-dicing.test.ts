import { diceZones, Span, SrcZone, DstZone, Zone } from "./zone-dicing";

test("Multi condition set dicing", () => {
    MultiDiceTest<number>(
        12,
        MakeZone(1, [1, 2], [1, 2], [1, 2]),
        MakeZone(2, [1, 2], [1, 2], [2, 3]),
        MakeZone(3, [3, 4], [0, 3], [0, 2]),
        MakeZone(4, [0, 2], [0, 4], [0, 4]),
        MakeZone(5, [2, 4], [0, 4], [1, 4])
    );

    MultiDiceTest<number>(
        2,
        MakeZone(1, [0, 2], [0, 4], [0, 4]),
        MakeZone(2, [2, 4], [0, 4], [1, 4])
    );

    MultiDiceTest<number>(
        1,
        MakeZone(1, [0, 2], [0, 4], [0, 4]),
        MakeZone(2, [0, 2], [0, 4], [0, 4])
    );

    MultiDiceTest<number>(
        7,
        MakeZone(1, [1, 3], [1, 3], [1, 3]),
        MakeZone(2, [2, 4], [2, 4], [2, 4])
    );
});

function MultiDiceTest<S>(zoneCount: number, ...zoneSets: SrcZone<S>[]) {
    const results = Array.from(diceZones(3, zoneSets));
    expect(results.length).toBe(zoneCount);
    validateZoneCoverage(3, zoneSets, results);
    validateZonesNotOverlapping(3, results);
    for (const [zone, sSet] of results) validateMultiZone(zoneSets, zone, sSet);
}

function validateZoneCoverage<S>(dn: number, zoneSets: SrcZone<S>[], results: DstZone<S>[]) {
    for (const [zone] of zoneSets) {
        for (const tp of testPointInZone(dn, 0, [], zone)) {
            let found = false;
            for (const [dstZone] of results) {
                let match = true;
                for (let d = 0; d < dn; d++)
                    if (tp[d] < dstZone[d][0] || tp[d] > dstZone[d][1]) match = false;
                if (match) {
                    found = true;
                    break;
                }
            }
            expect(found).toBeTruthy();
        }
    }
}

function validateZonesNotOverlapping<S>(dn: number, results: DstZone<S>[]) {
    for (const [srcZone] of results) {
        for (const [dstZone] of results) {
            if (dstZone === srcZone) continue;
            let overlap = true;
            for (let d = 0; d < dn; d++) {
                const overlapMin = Math.min(srcZone[d][0], dstZone[d][0]);
                const overlapMax = Math.max(srcZone[d][1], dstZone[d][1]);
                const srcLength = srcZone[d][1] - srcZone[d][0];
                const dstLength = dstZone[d][1] - dstZone[d][0];
                if (overlapMax - overlapMin >= srcLength + dstLength) overlap = false;
            }
            if (overlap) fail("Zones overlap");
        }
    }
}

function* testPointInZone(
    dn: number,
    d: number,
    carry: number[],
    zone: Zone
): IterableIterator<number[]> {
    if (d >= dn) {
        yield carry;
        return;
    }
    for (const p of [0, 1 / 2, 1]) {
        const t = zone[d][0] + p * (zone[d][1] - zone[d][0]);
        carry[d] = t;
        yield* testPointInZone(dn, d + 1, carry, zone);
    }
}

function validateMultiZone<S>(zoneSets: SrcZone<S>[], zone: Span[], sSet: S[]) {
    const matchingSSet: S[] = [];
    for (const [srcZone, sel] of zoneSets) {
        let inZone = true;
        for (let d = 0; d < zone.length; d += 1) {
            if (zone[d][0] < srcZone[d][0] || zone[d][1] > srcZone[d][1]) {
                inZone = false;
                break;
            }
        }
        if (inZone) matchingSSet.push(sel);
    }
    expect(sSet).toEqual(matchingSSet);
}

function MakeZone<S>(x: S, ...spans: Span[]): SrcZone<S> {
    return [spans, x];
}
