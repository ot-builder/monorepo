import * as Ot from "@ot-builder/font";

import { AxisRectifier } from "../interface";

export function rectifyAxisAvar(rec: AxisRectifier, avar: Ot.Avar.Table) {
    const maps1: Map<Ot.Var.Dim, Ot.Avar.SegmentMap> = new Map();
    for (const [dim, sgm] of avar.segmentMaps) {
        const mappedDim = rec.dim(dim);
        if (mappedDim) maps1.set(mappedDim, sgm);
    }
    for (const axis of rec.addedAxes) {
        maps1.set(axis.dim, [
            [-1, -1],
            [0, 0],
            [1, 1]
        ]);
    }
    return new Ot.Avar.Table(maps1);
}
