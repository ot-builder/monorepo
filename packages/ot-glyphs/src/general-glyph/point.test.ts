import { Algebra } from "@ot-builder/prelude";

import { Point } from "./point";
import { Transform2X3 } from "./transform-2x3";

const StaticPointFactory: Point.PointFactoryT<number> = {
    create: (x, y, kind) => ({ x, y, kind })
};

const Op = new Point.OpT(Algebra.Num, StaticPointFactory);

test("Scale composition -- identity", () => {
    const id: Transform2X3.T<number> = { xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0 };
    const tb: Transform2X3.T<number> = { xx: 2, xy: 1, yx: 3, yy: 2, dx: 2, dy: 4 };

    expect(Op.combineTransform(tb, id)).toEqual(tb);
    expect(Op.combineTransform(id, tb)).toEqual(tb);
});

function transformCompositionTestLoop(ta: Transform2X3.T<number>, tb: Transform2X3.T<number>) {
    const composite = Op.combineTransform(ta, tb);
    for (let x = -5; x <= 5; x++)
        for (let y = -5; y <= 5; y++) {
            const z0 = { x, y, kind: 0 };
            const z1 = Op.applyTransform(Op.applyTransform(z0, tb), ta);
            const z2 = Op.applyTransform(z0, composite);
            expect({ x, y, z: z2 }).toEqual({ x, y, z: z1 });
        }
}

test("Scale composition -- normal", () => {
    transformCompositionTestLoop(
        { xx: 0.5, xy: -0.25, yx: -0.5, yy: 0.25, dx: 1, dy: 1 },
        { xx: 2, xy: 1, yx: 3, yy: 2, dx: 2, dy: 4 }
    );
});

test("Scale composition -- scaled offset", () => {
    transformCompositionTestLoop(
        { scaledOffset: true, xx: 0.5, xy: -0.25, yx: -0.5, yy: 0.25, dx: 1, dy: 1 },
        { scaledOffset: true, xx: 2, xy: 1, yx: 3, yy: 2, dx: 2, dy: 4 }
    );
});
