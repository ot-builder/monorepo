import { diceZones, Span, SrcZone } from "./zone-dicing";

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

function MultiDiceTest<S>(zoneSets: SrcZone<S>[]) {
    const results = Array.from(diceZones(3, zoneSets));
    for (const [zone, sSet] of results) validateMultiZone(zoneSets, zone, sSet);
}

test("Multi condition set dicing", () => {
    MultiDiceTest<number>([
        [
            [
                [0, 2],
                [0, 4],
                [0, 4]
            ],
            4
        ],
        [
            [
                [2, 4],
                [0, 4],
                [1, 4]
            ],
            5
        ],
        [
            [
                [1, 2],
                [1, 2],
                [1, 2]
            ],
            1
        ],
        [
            [
                [1, 2],
                [1, 2],
                [2, 3]
            ],
            2
        ],
        [
            [
                [3, 4],
                [0, 3],
                [0, 2]
            ],
            3
        ]
    ]);

    MultiDiceTest<number>([
        [
            [
                [0, 2],
                [0, 4],
                [0, 4]
            ],
            1
        ],
        [
            [
                [2, 4],
                [0, 4],
                [1, 4]
            ],
            2
        ]
    ]);

    MultiDiceTest<number>([
        [
            [
                [0, 2],
                [0, 4],
                [0, 4]
            ],
            1
        ],
        [
            [
                [0, 2],
                [0, 4],
                [0, 4]
            ],
            2
        ]
    ]);
});
