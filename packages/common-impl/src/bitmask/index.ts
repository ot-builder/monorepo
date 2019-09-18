export type BitMask = boolean[];
export type ReadonlyBitMask = ReadonlyArray<boolean>;
export namespace BitMask {
    export function Falses(n: number) {
        let mask: BitMask = [];
        for (let id = 0; id < n; id++) {
            mask[id] = false;
        }
        return mask;
    }
    export function Trues(n: number) {
        let mask: BitMask = [];
        for (let id = 0; id < n; id++) {
            mask[id] = true;
        }
        return mask;
    }
    export function allFalseN(n: number, mask: ReadonlyBitMask) {
        for (let id = 0; id < n; id++) {
            if (mask[id]) return false;
        }
        return true;
    }
    export function allTrueN(n: number, mask: ReadonlyBitMask) {
        for (let id = 0; id < n; id++) {
            if (!mask[id]) return false;
        }
        return true;
    }
    export function allFalse(mask: ReadonlyBitMask) {
        return allFalseN(mask.length, mask);
    }
    export function allTrue(mask: ReadonlyBitMask) {
        return allTrueN(mask.length, mask);
    }
    export function toIndexes(mask: ReadonlyBitMask) {
        let a: number[] = [];
        for (let id = 0; id < mask.length; id++) {
            if (mask[id]) a.push(id);
        }
        return a;
    }
}
