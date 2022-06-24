import { Algebra } from "@ot-builder/prelude";

import * as Point from "./point/point";
import * as Transform2X3 from "./transform-2x3";

const StaticPointFactory: Point.PointFactoryT<number> = {
    create: (x, y, kind) => ({ x, y, kind })
};

const Op = new Point.OpT(Algebra.Num, StaticPointFactory);

test("Transform Application -- normal", () => {
    const tb = { xx: 1, yx: 2, xy: 3, yy: 4, dx: 5, dy: 6 };
    expect(Op.applyTransform({ x: 0, y: 0, kind: 0 }, tb)).toEqual({ x: 5, y: 6, kind: 0 });
    expect(Op.applyTransform({ x: 1, y: 0, kind: 0 }, tb)).toEqual({ x: 6, y: 9, kind: 0 });
    expect(Op.applyTransform({ x: 0, y: 1, kind: 0 }, tb)).toEqual({ x: 7, y: 10, kind: 0 });
});

test("Transform Application -- scaled offset", () => {
    const tb = { scaledOffset: true, xx: 1, yx: 2, xy: 3, yy: 4, dx: 5, dy: 6 };
    expect(Op.applyTransform({ x: 0, y: 0, kind: 0 }, tb)).toEqual({ x: 17, y: 39, kind: 0 });
    expect(Op.applyTransform({ x: 1, y: 0, kind: 0 }, tb)).toEqual({ x: 18, y: 42, kind: 0 });
    expect(Op.applyTransform({ x: 0, y: 1, kind: 0 }, tb)).toEqual({ x: 19, y: 43, kind: 0 });
});

test("removeScaledOffset", () => {
    const tb = { scaledOffset: true, xx: 1, yx: 2, xy: 3, yy: 4, dx: 5, dy: 6 };
    const tbr = Op.removeScaledOffset(tb);
    for (let x = -5; x <= 5; x++)
        for (let y = -5; y <= 5; y++) {
            const z = { x, y, kind: 0 };
            expect(Op.applyTransform(z, tb)).toEqual(Op.applyTransform(z, tbr));
        }
});

test("Transform composition -- identity", () => {
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
            expect(z1).toEqual(z2);
        }
}

test("Transform composition -- normal", () => {
    transformCompositionTestLoop(
        { xx: 0.5, xy: -0.25, yx: -0.5, yy: 0.25, dx: 1, dy: 1 },
        { xx: 2, xy: 1, yx: 3, yy: 2, dx: 2, dy: 4 }
    );
});

test("Transform composition -- scaled offset", () => {
    transformCompositionTestLoop(
        { scaledOffset: true, xx: 0.5, xy: -0.25, yx: -0.5, yy: 0.25, dx: 1, dy: 1 },
        { scaledOffset: true, xx: 2, xy: 1, yx: 3, yy: 2, dx: 2, dy: 4 }
    );
});
