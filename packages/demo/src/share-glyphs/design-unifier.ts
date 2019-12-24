import { Ot, Rectify } from "ot-builder";

import { DimMapper, MasterProcessor, ValueProcessor } from "./value-process";

export class DesignUnifierSession {
    public am = new DimMapper();
    public vp = new ValueProcessor(new MasterProcessor(this.am));
}

export class DesignSpaceUnifier implements Rectify.AxisRectifier, Rectify.CoordRectifier {
    constructor(
        private session: DesignUnifierSession,
        fvarRef: Ot.Fvar.Table,
        fvarCur: Ot.Fvar.Table
    ) {
        if (fvarRef.axes.length !== fvarCur.axes.length) {
            throw new Error("Fvar axes count mismatch");
        }
        for (let aid = 0; aid < fvarCur.axes.length; aid++) {
            const curDim = fvarCur.axes[aid].dim;
            const refDim = fvarRef.axes[aid].dim;
            if (
                refDim.tag !== curDim.tag ||
                refDim.min !== curDim.min ||
                refDim.default !== curDim.default ||
                refDim.max !== curDim.max
            ) {
                throw new Error("Axis dimension incompatible");
            }
            session.am.alias(fvarCur.axes[aid].dim, fvarRef.axes[aid].dim);
        }
    }
    public addedAxes = [];
    public dim(d: Ot.Var.Dim) {
        return this.session.am.reverse(this.session.am.put(d));
    }
    public axis(a: Ot.Fvar.Axis) {
        return new Ot.Fvar.Axis(this.dim(a.dim), a.axisNameID, a.flags);
    }
    public coord(v: Ot.Var.Value) {
        return this.session.vp.toUniqueValue(v);
    }
    public cv(v: Ot.Var.Value) {
        return this.session.vp.toUniqueValue(v);
    }
}
