import { Data } from "@ot-builder/prelude";

import { VarianceDim as Dim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";
import { VarianceMasterSet } from "../interface/master";
import { VariableCreator, VariableOps } from "../interface/value";

import { OtVarMaster, OtVarMasterDim } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarCreatorImpl, OtVarOps, OtVarValue } from "./ops";

export { VarianceDim as Dim } from "../interface/dimension";

// Type exports
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
