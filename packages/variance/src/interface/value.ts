import { VectorSpace } from "@ot-builder/prelude/lib/algebra";

import { VarianceDim } from "./dimension";
import { VarianceInstance } from "./instance";
import { VarianceMaster, VarianceMasterSet } from "./master";

/**
 * VariableOps<A,M,X> contains various methods to manipulate variable values (X)
 */
export interface VariableOps<A extends VarianceDim, M extends VarianceMaster<A>, X>
    extends VectorSpace<X, number> {
    originOf(x: X): number;
    varianceOf(x: X): Iterable<[M, number]>;
    removeOrigin(x: X): X;
    evaluate(a: X, instance: VarianceInstance<A>): number;
    equal(a: X, b: X, err?: number): boolean;
    sum(...xs: (X | [number, X])[]): X;
    isConstant(x: X): boolean;
    isZero(x: X): boolean;

    Creator(ms?: VarianceMasterSet<A, M>): VariableCreator<A, M, X>;
}

export interface VariableCreator<A extends VarianceDim, M extends VarianceMaster<A>, X> {
    readonly masterSet: VarianceMasterSet<A, M>;
    create(origin?: number, variance?: Iterable<[M, number]>): X;
    make(...xs: (X | [M, number])[]): X;
}
