import * as Ot from "@ot-builder/font";

import { AxisRectifier } from "../interface";

export function rectifyAxisAvar(rec: AxisRectifier, avar: Ot.Avar.Table) {
    let maps1: Map<Ot.Var.Axis, Ot.Avar.SegmentMap> = new Map();
    for (const [axis, sgm] of avar.segmentMaps) {
        const mappedAxis = rec.axis(axis);
        if (mappedAxis) maps1.set(mappedAxis, sgm);
    }
    for (const axis of rec.addedAxes) {
        maps1.set(axis, [
            [-1, -1],
            [0, 0],
            [1, 1]
        ]);
    }
    return new Ot.Avar.Table(maps1);
}
