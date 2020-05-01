import { VarianceDim } from "../interface/dimension";

import { OtVarMaster } from "./master";

const Wght = new VarianceDim("wght", 100, 400, 900);
const Wdth = new VarianceDim("wdth", 25, 100, 200);

test("Variance Region evaluation test", () => {
    const wide = new OtVarMaster([
        { dim: Wght, min: -1, peak: 0, max: 1 },
        { dim: Wdth, min: 0, peak: 1, max: 1 }
    ]);
    const corner = new OtVarMaster([
        { dim: Wght, min: 0, peak: 1, max: 1 },
        { dim: Wdth, min: 0, peak: 1, max: 1 }
    ]);

    expect(
        wide.evaluate(
            new Map([
                [Wght, 0],
                [Wdth, 0]
            ])
        )
    ).toBe(0);
    expect(
        wide.evaluate(
            new Map([
                [Wght, 1],
                [Wdth, 0]
            ])
        )
    ).toBe(0);
    expect(
        wide.evaluate(
            new Map([
                [Wght, 0],
                [Wdth, 1]
            ])
        )
    ).toBe(1);
    expect(
        wide.evaluate(
            new Map([
                [Wght, 1],
                [Wdth, 1]
            ])
        )
    ).toBe(1);
    expect(wide.evaluate(null)).toBe(0);

    expect(
        corner.evaluate(
            new Map([
                [Wght, 1],
                [Wdth, 1]
            ])
        )
    ).toBe(1);
    expect(
        corner.evaluate(
            new Map([
                [Wght, 1 / 2],
                [Wdth, 1 / 2]
            ])
        )
    ).toBe(1 / 4);
    expect(
        corner.evaluate(
            new Map([
                [Wght, 1],
                [Wdth, 0]
            ])
        )
    ).toBe(0);

    expect(wide.isSimple()).toBe(true);
    expect(corner.isSimple()).toBe(true);
});
