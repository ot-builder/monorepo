import * as Ot from "@ot-builder/font";

import { AxisRectifier } from "../interface";

export function rectifyAxisFvar(rec: AxisRectifier, fvar: Ot.Fvar.Table) {
    const axes = rectifyAxesImpl(rec, fvar);
    const instances = rectifyInstances(rec, rec.addedAxes, fvar);
    return new Ot.Fvar.Table(axes, instances);
}

function rectifyAxesImpl(rectify: AxisRectifier, fvar: Ot.Fvar.Table) {
    const axesRectifyResults: Map<Ot.Fvar.Axis, Ot.Fvar.Axis> = new Map();
    for (const a of fvar.axes) {
        const a1 = rectify.axis(a);
        if (a1) axesRectifyResults.set(a, a1);
    }
    const axes = [...axesRectifyResults.values(), ...rectify.addedAxes];
    return axes;
}

function rectifyInstances(
    rec: AxisRectifier,
    addedAxes: ReadonlyArray<Ot.Fvar.Axis>,
    fvar: Ot.Fvar.Table
) {
    const newInstances: Ot.Fvar.Instance[] = [];
    for (const instance of fvar.instances) {
        const coordinates = instance.coordinates;
        const coordinates1 = rectifyCoordinates(coordinates, rec, addedAxes);
        newInstances.push(
            new Ot.Fvar.Instance(
                instance.subfamilyNameID,
                instance.flags,
                coordinates1,
                instance.postScriptNameID
            )
        );
    }
    return newInstances;
}

function rectifyCoordinates(
    coordinates: Ot.Var.Instance,
    rec: AxisRectifier,
    addedAxes: ReadonlyArray<Ot.Fvar.Axis>
) {
    if (!coordinates) return coordinates;

    const coordinates1: Map<Ot.Var.Dim, number> = new Map();
    for (const [d, val] of coordinates) {
        const mapped = rec.dim(d);
        if (mapped) coordinates1.set(d, val);
    }
    for (const axis of addedAxes) coordinates1.set(axis.dim, 0);
    return coordinates1;
}
