import { Data } from "@ot-builder/prelude";

import { VarianceDim as Dim } from "../interface/dimension";
import { VarianceInstance } from "../interface/instance";

import { OtVarMaster, OtVarMasterDim } from "./master";
import { OtVarMasterSet } from "./master-set";
import { OtVarValueFactory } from "./ops";

// Type exports
export type DesignSpace = Data.Order<Dim>;
export type Instance = VarianceInstance<Dim>;
export { VarianceDim as Dim } from "../interface/dimension";
export { OtVarMaster as Master, OtVarMasterDim as MasterDim } from "./master";
export { OtVarMasterSet as MasterSet } from "./master-set";
export { OtVarOps as Ops, OtVarValueFactory as ValueFactory } from "./ops";
export { OtVarValue as Value } from "./value";

// [DEPRECATED] Kept for compatibility
export namespace Create {
    export function Master(init: Iterable<null | undefined | OtVarMasterDim>): OtVarMaster {
        return new OtVarMaster(init);
    }
    export function MasterSet(): OtVarMasterSet {
        return new OtVarMasterSet();
    }
    export function ValueFactory(ms?: OtVarMasterSet): OtVarValueFactory {
        return new OtVarValueFactory(ms || MasterSet());
    }
}
