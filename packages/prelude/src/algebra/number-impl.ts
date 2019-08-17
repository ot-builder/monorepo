import { Ring, VectorSpace } from "./interface";

export const Num: Ring<number> & VectorSpace<number, number> = {
    neutral: 0,
    unit: 1,
    add: (a, b) => a + b,
    negate: a => -a,
    minus: (a, b) => a - b,
    times: (a, b) => a * b,
    scale: (a, b) => a * b,
    addScale: (a, s, b) => a + s * b
};
