import { VarianceAxis } from "./axis";
import { VarianceInstance, VarianceInstanceTuple } from "./instance";

export interface VarianceMaster<A extends VarianceAxis> {
    /**
     * Return the peak instance
     */
    getPeak(): VarianceInstanceTuple<A>
    /**
     * Weight an instance under this master
     * If the master is invalid always return 0
     * @param instance instance to weight
     */;
    evaluate(instance: VarianceInstance<A>): number;
}

export type VarianceMasterCollectResult<
    A extends VarianceAxis,
    M extends VarianceMaster<VarianceAxis>
> = {
    /** Index of master */
    readonly index: number;
    /** Consolidated master */
    readonly master: M;
};

export interface VarianceMasterSet<A extends VarianceAxis, M extends VarianceMaster<VarianceAxis>>
    extends Iterable<[M, number]> {
    /** Size of master set */
    readonly size: number;

    /**
     * Get or push a master to the master set.
     * Return undefined if master is invalid (i.e., neutral)
     * Otherwise a result containing consolidated master and its index
     * @param master Master to process
     */
    getOrPush(master: M): VarianceMasterCollectResult<A, M> | undefined;
}
