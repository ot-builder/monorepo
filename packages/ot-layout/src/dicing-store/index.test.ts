import { DicingStoreImpl } from "./index";

describe("Dicing store", () => {
    test("Should work", () => {
        const ds = new DicingStoreImpl<number, number, number>();

        ds.set(new Set([1, 2, 3]), new Set([4, 5, 6]), 1);
        expect(ds.get(1, 4)).toBe(1);

        ds.set(new Set([2, 3, 5]), new Set([5, 6, 7]), 2);
        expect(ds.get(1, 4)).toBe(1);
        expect(ds.get(2, 5)).toBe(2);
        expect(ds.get(4, 7)).toBe(undefined);
        expect(ds.get(5, 7)).toBe(2);
        expect(ds.getXClassDef()).toEqual([[1], [2, 3], [5]]);
        expect(ds.getYClassDef()).toEqual([[4], [5, 6], [7]]);

        ds.set(new Set([2, 3, 5]), new Set([5, 6, 7]), 3);
        expect(ds.get(1, 4)).toBe(1);
        expect(ds.get(2, 5)).toBe(3);
        expect(ds.get(4, 7)).toBe(undefined);
        expect(ds.get(5, 7)).toBe(3);
        expect(ds.getXClassDef()).toEqual([[1], [2, 3], [5]]);
        expect(ds.getYClassDef()).toEqual([[4], [5, 6], [7]]);
    });

    test("setIfAbsent should work", () => {
        const ds = new DicingStoreImpl<number, number, number>();
        ds.set(new Set([1, 2, 3]), new Set([4, 5, 6]), 1);
        expect(ds.get(1, 4)).toBe(1);
        ds.setIfAbsent(new Set([2, 3, 5]), new Set([5, 6, 7]), 2);
        expect(ds.get(1, 4)).toBe(1);
        expect(ds.get(2, 5)).toBe(1);
        expect(ds.get(4, 7)).toBe(undefined);
        expect(ds.get(5, 7)).toBe(2);
    });

    test("Class splitting should copy all items of same row", () => {
        const ds = new DicingStoreImpl<number, number, number>();
        ds.set(new Set([1, 2, 3]), new Set([4, 5, 6]), 1);
        ds.set(new Set([7]), new Set([5]), 2);
        expect(ds.get(1, 4)).toBe(1);
        expect(ds.get(1, 5)).toBe(1);
        expect(ds.get(7, 5)).toBe(2);
    });

    test("Class splitting should copy all items of same column", () => {
        const ds = new DicingStoreImpl<number, number, number>();
        ds.set(new Set([1, 2, 3]), new Set([4, 5, 6]), 1);
        ds.set(new Set([2]), new Set([7]), 2);
        expect(ds.get(1, 4)).toBe(1);
        expect(ds.get(1, 5)).toBe(1);
        expect(ds.get(2, 5)).toBe(1);
        expect(ds.get(2, 7)).toBe(2);
    });
});
