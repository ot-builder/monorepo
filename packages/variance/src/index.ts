import { Data } from "@ot-builder/prelude";

import {
    GeneralCollectedValueFactory,
    GeneralVariableValueCollector
} from "./general-impl/value-collector";
import { VarianceDim } from "./interface/dimension";
import { VarianceInstance } from "./interface/instance";
import {
    VarianceMaster,
    VarianceMasterCollectResult,
    VarianceMasterSet
} from "./interface/master";
import { VariableCreator, VariableOps } from "./interface/value";
import { OtVarMaster, OtVarMasterDim, OtVarMasterSet, OtVarOps, OtVarValue } from "./otvar-impl";

export namespace GeneralVar {
    export type Dim = VarianceDim;
    export type Master<A extends Dim> = VarianceMaster<A>;
    export type MasterSet<A extends Dim, M extends Master<A>> = VarianceMasterSet<A, M>;
    export type MasterCollectResult<
        A extends Dim,
        M extends Master<A>
    > = VarianceMasterCollectResult<A, M>;
    export type Ops<A extends Dim, M extends Master<A>, X> = VariableOps<A, M, X>;
    export type ValueCreator<A extends Dim, M extends Master<A>, X> = VariableCreator<A, M, X>;
    export type ValueCollector<
        A extends VarianceDim,
        M extends VarianceMaster<A>,
        X,
        D
    > = GeneralVariableValueCollector<A, M, X, D>;
    export type CollectedValueFactory<
        A extends VarianceDim,
        M extends VarianceMaster<A>,
        X,
        D
    > = GeneralCollectedValueFactory<A, M, X, D>;
    export type Instance<A extends Dim> = VarianceInstance<A>;
}

export namespace OtVar {
    // Type exports
    export type Dim = VarianceDim;
    export type DesignSpace = Data.Order<Dim>;
    export type MasterDim = OtVarMasterDim<Dim>;
    export type Master = OtVarMaster<Dim>;
    export type Instance = VarianceInstance<Dim>;
    export type Value = OtVarValue<Dim, Master>;
    export type MasterSet = OtVarMasterSet<Dim>;
    export type Ops = VariableOps<Dim, Master, Value>;
    export type ValueCreator = VariableCreator<Dim, Master, Value>;
    export type ValueCollector<D> = GeneralVariableValueCollector<Dim, Master, Value, D>;
    export type CollectedValueFactory<D> = GeneralCollectedValueFactory<Dim, Master, Value, D>;

    // Factory exports
    export const Ops = OtVarOps;
    export namespace Create {
        export function Master(init: Iterable<null | undefined | OtVarMasterDim<Dim>>): Master {
            return new OtVarMaster(init);
        }
        export function MasterSet(): MasterSet {
            return new OtVarMasterSet<Dim>();
        }
        export function ValueCollector<D>(dvf: CollectedValueFactory<D>): ValueCollector<D> {
            return new GeneralVariableValueCollector(Ops, MasterSet(), dvf);
        }
    }
}

export namespace GeneralVarInternalImpl {
    export const ValueCollector = GeneralVariableValueCollector;
}
