import {
    GeneralCollectedValueFactory,
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
    export type ValueCreator<A extends Axis, M extends Master<A>, X> = VariableCreator<A, M, X>;
    export type ValueCollector<
        A extends VarianceAxis,
        M extends VarianceMaster<A>,
        X,
        D
    > = GeneralVariableValueCollector<A, M, X, D>;
    export type CollectedValueFactory<
        A extends VarianceAxis,
        M extends VarianceMaster<A>,
        X,
        D
    > = GeneralCollectedValueFactory<A, M, X, D>;
    export type Instance<A extends Axis> = VarianceInstance<A>;
}

export namespace OtVar {
    // Type exports
    export type Axis = VarianceAxis;
    export type MasterDim = OtVarMasterDim<Axis>;
    export type Master = OtVarMaster<Axis>;
    export type Instance = VarianceInstance<Axis>;
    export type Value = OtVarValue<Axis, Master>;
    export type MasterSet = OtVarMasterSet<Axis>;
    export type Ops = VariableOps<Axis, Master, Value>;
    export type ValueCreator = VariableCreator<Axis, Master, Value>;
    export type ValueCollector<D> = GeneralVariableValueCollector<Axis, Master, Value, D>;
    export type CollectedValueFactory<D> = GeneralCollectedValueFactory<Axis, Master, Value, D>;

    // Factory exports
    export const Ops = OtVarOps;
    export namespace Create {
        export function Master(init: Iterable<OtVarMasterDim<Axis>>): Master {
            return new OtVarMaster(init);
        }
        export function MasterSet(): MasterSet {
            return new OtVarMasterSet<Axis>();
        }
        export function ValueCollector<D>(dvf: CollectedValueFactory<D>): ValueCollector<D> {
            return new GeneralVariableValueCollector(Ops, MasterSet(), dvf);
        }
    }
}

export namespace GeneralVarInternalImpl {
    export const ValueCollector = GeneralVariableValueCollector;
}
