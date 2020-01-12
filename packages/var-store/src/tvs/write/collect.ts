import { ImpLib } from "@ot-builder/common-impl";
import { GeneralVarInternalImpl, OtVar } from "@ot-builder/variance";

export class TvsCollector extends GeneralVarInternalImpl.ValueCollector<
    OtVar.Dim,
    OtVar.Master,
    OtVar.Value,
    DelayDeltaValue
> {
    constructor(masterCollector: OtVar.MasterSet) {
        super(
            OtVar.Ops,
            masterCollector,
            (col, origin, deltaMA) => new DelayDeltaValue(col, origin, deltaMA)
        );
    }
}

export class DelayDeltaValue {
    constructor(private col: TvsCollector, public origin: number, private deltaMA: number[]) {}
    public resolve() {
        return this.col.resolveDeltas(this.deltaMA);
    }
}

export function collectDeltaData(mc: TvsCollector, dimensions: number, data: OtVar.Value[][]) {
    const ans: DelayDeltaValue[][] = [];
    for (const contour of data) {
        const z: DelayDeltaValue[] = [];
        const n = ImpLib.Arith.rowCount(contour, dimensions);
        for (let zid = 0; zid < n; zid++) {
            for (let dim = 0; dim < dimensions; dim++) {
                z[ImpLib.Arith.d2(dimensions, zid, dim)] = mc.collect(
                    contour[ImpLib.Arith.d2(dimensions, zid, dim)]
                );
            }
        }
        ans.push(z);
    }
    mc.settleDown();
    return ans;
}
