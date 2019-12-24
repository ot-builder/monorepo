import { VarianceDim } from "./dimension";
import { VarianceInstance, VarianceInstanceTuple } from "./instance";

export interface VarianceMaster<A extends VarianceDim> {
    /**
     * Return the peak instance
     */
    getPeak(): VarianceInstanceTuple<A>;
    /**
     * Weight an instance under this master
     * If the master is invalid always return 0
     * @param instance instance to weight
     */
    evaluate(instance: VarianceInstance<A>): number;
}

export type VarianceMasterCollectResult<
    A extends VarianceDim,
    M extends VarianceMaster<VarianceDim>
> = {
    /** Index of master */
    readonly index: number;
    /** Consolidated master */
    readonly master: M;
};

export interface VarianceMasterSet<A extends VarianceDim, M extends VarianceMaster<VarianceDim>>
    extends Iterable<[M, number]> {
    /** Size of master set */
    readonly size: number;
    /** Query the records and return the index and corresponding collected masters, or `undefined` if the master is not recorded. */
    get(master: M): VarianceMasterCollectResult<A, M> | undefined;
    /** Query the records and return the index and corresponding collected masters, or add it into the record if it is not collected. Returns `undefined` when the master is considered invalid. */
    getOrPush(master: M): VarianceMasterCollectResult<A, M> | undefined;
}
