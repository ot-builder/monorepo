import type { VarianceDim as Dim } from "./dimension";
import type { VarianceInstance } from "./instance";
import type { VarianceMaster, VarianceMasterCollectResult, VarianceMasterSet } from "./master";
import type { VariableCreator, VariableOps } from "./value";

export { VarianceDim as Dim } from "./dimension";

export type Master<A extends Dim> = VarianceMaster<A>;
export type MasterSet<A extends Dim, M extends Master<A>> = VarianceMasterSet<A, M>;
export type MasterCollectResult<A extends Dim, M extends Master<A>> = VarianceMasterCollectResult<
    A,
    M
>;
export type Ops<A extends Dim, M extends Master<A>, X> = VariableOps<A, M, X>;
export type Instance<A extends Dim> = VarianceInstance<A>;
export type ValueFactory<A extends Dim, M extends Master<A>, X> = VariableCreator<A, M, X>;
