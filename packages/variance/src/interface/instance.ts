import { Data } from "@ot-builder/prelude";

import { VarianceAxis } from "./axis";

export type VarianceInstanceTupleW<A extends VarianceAxis> = Map<A, number>;
export type VarianceInstanceTuple<A extends VarianceAxis> = ReadonlyMap<A, number>;
export type VarianceInstance<A extends VarianceAxis> = Data.Maybe<VarianceInstanceTuple<A>>;
