import { Rectify } from "@ot-builder/rectify";

import {
    DelayVariableValueFactory,
    GeneralVariableValueCollector
} from "./general-impl/value-collector";
import { VarianceAxis } from "./interface/axis";
import { VarianceInstance } from "./interface/instance";
import { VarianceMaster, VarianceMasterCollectResult, VarianceMasterSet } from "./interface/master";
import { VariableCreator, VariableOps } from "./interface/value";
import { OtVarMaster, OtVarMasterDim, OtVarMasterSet, OtVarOps, OtVarValue } from "./otvar-impl";

export namespace GeneralVar {
    export type Axis = VarianceAxis;
    export type Master<A extends Axis> = VarianceMaster<A>;
    export type MasterSet<A extends Axis, M extends Master<A>> = VarianceMasterSet<A, M>;
    export type MasterCollectResult<
        A extends Axis,
        M extends Master<A>
    > = VarianceMasterCollectResult<A, M>;
    export type Ops<A extends Axis, M extends Master<A>, X> = VariableOps<A, M, X>;
    export type ValueCollector<
        A extends VarianceAxis,
        M extends VarianceMaster<A>,
        X,
        D
    > = GeneralVariableValueCollector<A, M, X, D>;
    export const ValueCollector = GeneralVariableValueCollector;
    export type DelayValueFactory<
        A extends VarianceAxis,
        M extends VarianceMaster<A>,
        X,
        D
    > = DelayVariableValueFactory<A, M, X, D>;
    export type Instance<A extends Axis> = VarianceInstance<A>;

    export type ValueCreator<A extends Axis, M extends Master<A>, X> = VariableCreator<A, M, X>;
}

export namespace OtVar {
    export type Axis = VarianceAxis;
    export type MasterDim = OtVarMasterDim<Axis>;
    export namespace MasterDim {
        export function fromPeak(axis: Axis, peak: number): OtVarMasterDim<Axis> {
            if (peak > 0) return { axis, min: 0, peak, max: peak };
            else if (peak < 0) return { axis, min: peak, peak, max: 0 };
            else return { axis, min: 0, peak: 0, max: 0 };
        }
        export function isSimple(dim: MasterDim) {
            if (dim.peak > 0) return dim.min === 0 && dim.max === dim.peak;
            else if (dim.peak < 0) return dim.min === dim.peak && dim.max === 0;
            else return true;
        }
    }
    export type Master = OtVarMaster<Axis>;
    export const Master = OtVarMaster;
    export type Value = OtVarValue<Axis, Master>;
    export type MasterSet = OtVarMasterSet<Axis>;
    export const MasterSet = OtVarMasterSet;
    export type Ops = VariableOps<Axis, Master, Value>;
    export const Ops = OtVarOps;
    export type ValueCreator = VariableCreator<Axis, Master, Value>;

    export class ValueCollector<T> extends GeneralVariableValueCollector<
        OtVar.Axis,
        OtVar.Master,
        OtVar.Value,
        T
    > {}

    export type AxisRectifier = Rectify.Axis.RectifierT<Axis>;
    export type AxesRectifiable = Rectify.Axis.RectifiableT<Axis>;
    export type Rectifier = Rectify.Coord.RectifierT<Value>;
    export type Rectifiable = Rectify.Coord.RectifiableT<Value>;
}
