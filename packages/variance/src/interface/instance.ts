import { Data } from "@ot-builder/prelude";

import { VarianceDim } from "./dimension";

export type VarianceInstanceTupleW<A extends VarianceDim> = Map<A, number>;
export type VarianceInstanceTuple<A extends VarianceDim> = ReadonlyMap<A, number>;
export type VarianceInstance<A extends VarianceDim> = Data.Maybe<VarianceInstanceTuple<A>>;
