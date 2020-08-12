import { VarianceDim } from "../interface/dimension";

import { OtVarMaster } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarOps } from "./ops";
import { OtVarValueC } from "./value";

const Wght = new VarianceDim("wght", 100, 400, 900);
const Wdth = new VarianceDim("wdth", 25, 100, 200);
const Bold = new OtVarMaster([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: -1, peak: 0, max: 1 }
]);

test("Variance Ops test", () => {
    const ms1 = new OtVarMasterSet();
    const ms2 = new OtVarMasterSet();
    const vv1 = OtVarValueC.Create(ms1, 100, [[Bold, 50]]);
    const vv2 = OtVarValueC.Create(ms1, 100, [[Bold, 60]]);
    const vv3 = OtVarValueC.Create(ms2, 120, [[Bold, 70]]);

    const sum1 = OtVarOps.add(vv1, vv2);
    const sum2 = OtVarOps.add(vv1, vv3);

    expect(OtVarOps.originOf(sum1)).toBe(200);
    expect(OtVarOps.varianceDeltaOf(sum1, Bold)).toBe(110);

    expect(OtVarOps.originOf(sum2)).toBe(220);
    expect(OtVarOps.varianceDeltaOf(sum2, Bold)).toBe(120);
});
