import { VarianceDim } from "../interface/dimension";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValueC } from "./value";

const Wght: VarianceDim = {
    tag: "wght",
    min: 100,
    default: 400,
    max: 900
};
const Wdth: VarianceDim = {
    tag: "wdth",
    min: 25,
    default: 100,
    max: 200
};
const Bold = new OtVarMaster([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold1 = new OtVarMaster([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold2 = new OtVarMaster([
    { dim: Wdth, min: -1, peak: 0, max: 1 },
    { dim: Wght, min: 0, peak: 1, max: 1 }
]);
const Wide = new OtVarMaster([
    { dim: Wght, min: -1, peak: 0, max: 1 },
    { dim: Wdth, min: 0, peak: 1, max: 1 }
]);
const Corner = new OtVarMaster([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: 0, peak: 1, max: 1 }
]);

test("Variance Value test", () => {
    const ms = new OtVarMasterSet();

    const vv = OtVarValueC.Create(ms, 100, []);
    expect(Bold).not.toBe(Bold1);
    expect(vv.origin).toBe(100);
    expect(vv.getDelta(Bold)).toBe(0);

    const vv1 = OtVarValueC.Create(ms, 100, [[Bold, 50]]);
    expect(vv1.getDelta(Bold)).toBe(50);
    expect(vv1.getDelta(Bold1)).toBe(50);
    expect(vv1.getDelta(Bold2)).toBe(50); // "Bold" and "Bold2" are identical

    const vv2 = OtVarValueC.Create(ms, 100, [
        [Bold, 50],
        [Wide, 70]
    ]);
    expect(vv2.getDelta(Wide)).toBe(70);
    expect(vv2.evaluate(Bold.getPeak())).toBe(150);
    expect(vv2.evaluate(Corner.getPeak())).toBe(220);
});
