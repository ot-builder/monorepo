import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyAxisFvar(rec: Rectify.Axis.RectifierT<Ot.Fvar.Axis>, fvar: Ot.Fvar.Table) {
    const { axesRectifyResults, axes } = rectifyAxesImpl(rec, fvar);
    const instances = rectifyInstances(axesRectifyResults, rec.addedAxes, fvar);
    return new Ot.Fvar.Table(axes, instances);
}

function rectifyAxesImpl(rectify: Rectify.Axis.RectifierT<Ot.Fvar.Axis>, fvar: Ot.Fvar.Table) {
    const axesRectifyResults: Map<Ot.Fvar.Axis, Ot.Fvar.Axis> = new Map();
    for (const a of fvar.axes) {
        const a1 = rectify.axis(a);
        if (a1) axesRectifyResults.set(a, a1);
    }
    const axes = [...axesRectifyResults.values(), ...rectify.addedAxes];
    return { axes, axesRectifyResults };
}

function rectifyInstances(
    axesRectifyResults: Map<Ot.Fvar.Axis, Ot.Fvar.Axis>,
    addedAxes: ReadonlyArray<Ot.Fvar.Axis>,
    fvar: Ot.Fvar.Table
) {
    const newInstances: Ot.Fvar.Instance[] = [];
    for (const instance of fvar.instances) {
        const coordinates = instance.coordinates;
        const coordinates1 = rectifyCoordinates(coordinates, axesRectifyResults, addedAxes);
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
    coordinates: Ot.GeneralVar.Instance<Ot.Fvar.Axis>,
    axesRectifyResults: Map<Ot.Fvar.Axis, Ot.Fvar.Axis>,
    addedAxes: ReadonlyArray<Ot.Fvar.Axis>
) {
    if (!coordinates) return coordinates;

    const coordinates1: Map<Ot.Fvar.Axis, number> = new Map();
    for (let [axis, val] of coordinates) {
        const mapped = axesRectifyResults.get(axis);
        if (mapped) coordinates1.set(axis, val);
    }
    for (const axis of addedAxes) coordinates1.set(axis, 0);
    return coordinates1;
}
