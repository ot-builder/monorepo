import { VarianceAxis } from "../interface/axis";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValueC } from "./value";

const Wght: VarianceAxis = {
    tag: "wght",
    min: 100,
    default: 400,
    max: 900
};
const Wdth: VarianceAxis = {
    tag: "wdth",
    min: 25,
    default: 100,
    max: 200
};
const Bold = new OtVarMaster([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold1 = new OtVarMaster([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold2 = new OtVarMaster([
    { axis: Wdth, min: -1, peak: 0, max: 1 },
    { axis: Wght, min: 0, peak: 1, max: 1 }
]);
const Wide = new OtVarMaster([
    { axis: Wght, min: -1, peak: 0, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);
const Corner = new OtVarMaster([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);

test("Variance Value test", () => {
    const vv = new OtVarValueC<VarianceAxis, OtVarMaster<VarianceAxis>>(100, new OtVarMasterSet());
    expect(Bold).not.toBe(Bold1);
    expect(vv.origin).toBe(100);
    expect(vv.getDelta(Bold)).toBe(0);
    vv.setDelta(Bold, 50);
    expect(vv.getDelta(Bold)).toBe(50);
    expect(vv.getDelta(Bold1)).toBe(50);
    expect(vv.getDelta(Bold2)).toBe(50); // "Bold" and "Bold2" are identical
    vv.addDelta(Wide, 70);
    expect(vv.getDelta(Wide)).toBe(70);
    expect(vv.evaluate(Bold.getPeak())).toBe(150);
    expect(vv.evaluate(Corner.getPeak())).toBe(220);
});
