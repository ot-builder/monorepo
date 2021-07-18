export const AxesCountMatch = (kind1: string, actual: number, kind2: string, expected: number) => {
    if (actual !== expected) {
        throw new TypeError(`Axis count mismatch : ${kind1} ${actual} <> ${kind2} ${expected}`);
    }
};
