import { Data } from "@ot-builder/prelude";

import { VarianceDim } from "./interface/dimension";
import { VarianceInstance } from "./interface/instance";
import {
    VarianceMaster,
    VarianceMasterCollectResult,
    VarianceMasterSet
} from "./interface/master";
import { VariableCreator, VariableOps } from "./interface/value";
import {
    OtVarCreatorImpl,
    OtVarMaster,
    OtVarMasterDim,
    OtVarMasterSet,
    OtVarOps,
    OtVarValue
} from "./otvar-impl";

export namespace GeneralVar {
    export type Dim = VarianceDim;
    export type Master<A extends Dim> = VarianceMaster<A>;
    export type MasterSet<A extends Dim, M extends Master<A>> = VarianceMasterSet<A, M>;
    export type MasterCollectResult<
        A extends Dim,
        M extends Master<A>
    > = VarianceMasterCollectResult<A, M>;
    export type Ops<A extends Dim, M extends Master<A>, X> = VariableOps<A, M, X>;
    export type Instance<A extends Dim> = VarianceInstance<A>;
    export type ValueFactory<A extends Dim, M extends Master<A>, X> = VariableCreator<A, M, X>;
}

export namespace OtVar {
    // Type exports
    export type Dim = VarianceDim;
    export type DesignSpace = Data.Order<Dim>;
    export type MasterDim = OtVarMasterDim<Dim>;
    export type Master = OtVarMaster<Dim>;
    export type Instance = VarianceInstance<Dim>;
    export type Value = OtVarValue<Dim, Master>;
    export type MasterSet = VarianceMasterSet<Dim, Master>;
    export type Ops = VariableOps<Dim, Master, Value>;
    export type ValueFactory = VariableCreator<Dim, Master, Value>;
    // Factory exports
    export const Ops = OtVarOps;
    export namespace Create {
        export function Master(init: Iterable<null | undefined | OtVarMasterDim<Dim>>): Master {
            return new OtVarMaster(init);
        }
        export function MasterSet(): MasterSet {
            return new OtVarMasterSet<Dim>();
        }
        export function ValueFactory(ms?: MasterSet): ValueFactory {
            return new OtVarCreatorImpl(ms || MasterSet(), OtVarOps);
        }
    }
}
