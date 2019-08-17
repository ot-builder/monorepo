export type Mask = boolean[];
export type ReadonlyMask = ReadonlyArray<boolean>;
export namespace Mask {
    export function Falses(n: number) {
        let mask: Mask = [];
        for (let id = 0; id < n; id++) {
            mask[id] = false;
        }
        return mask;
    }
    export function Trues(n: number) {
        let mask: Mask = [];
        for (let id = 0; id < n; id++) {
            mask[id] = true;
        }
        return mask;
    }
    export function allFalseN(n: number, mask: ReadonlyMask) {
        for (let id = 0; id < n; id++) {
            if (mask[id]) return false;
        }
        return true;
    }
    export function allTrueN(n: number, mask: ReadonlyMask) {
        for (let id = 0; id < n; id++) {
            if (!mask[id]) return false;
        }
        return true;
    }
    export function allFalse(mask: ReadonlyMask) {
        return allFalseN(mask.length, mask);
    }
    export function allTrue(mask: ReadonlyMask) {
        return allTrueN(mask.length, mask);
    }
    export function toIndexes(mask: ReadonlyMask) {
        let a: number[] = [];
        for (let id = 0; id < mask.length; id++) {
            if (mask[id]) a.push(id);
        }
        return a;
    }
}
