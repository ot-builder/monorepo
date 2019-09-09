import { VarianceAxis } from "../interface/axis";
import { VarianceInstance } from "../interface/instance";

export const OtVarInstance = {
    create<A extends VarianceAxis>(...bases: [A, number][]): VarianceInstance<A> {
        return new Map(bases);
    }
};
