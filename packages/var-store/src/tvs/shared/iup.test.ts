import { iupContour, TvdAccess } from "./iup";

class MockTvdAccess implements TvdAccess<number> {
    constructor(public readonly original: number) {}
    public deltas: number[] = [0];
    public addDelta(master: number, delta: number) {
        this.deltas[master] = (this.deltas[master] || 0) + delta;
    }
    public finish() {}
}

function setupOrig(...a: number[]) {
    return a.map(x => new MockTvdAccess(x));
}

function mapArr(a: MockTvdAccess[]) {
    return a.map(x => x.deltas[0]); // only 1 dimension
}

test("IUP test : empty delta case", () => {
    const orig = setupOrig(1, 0, 0, 1);
    iupContour(1, 0, 0, orig, 0, []);
    expect(mapArr(orig)).toEqual([0, 0, 0, 0]);
});
test("IUP test : one delta case", () => {
    const orig = setupOrig(1, 0, 0, 1);
    iupContour(1, 0, 0, orig, 0, [undefined, 1, undefined, undefined]);
    expect(mapArr(orig)).toEqual([1, 1, 1, 1]);
});
test("IUP test : interpolate case", () => {
    const orig = setupOrig(0, 1, 2, 1);
    iupContour(1, 0, 0, orig, 0, [0, undefined, 2, undefined]);
    expect(mapArr(orig)).toEqual([0, 1, 2, 1]);
});
test("IUP test : interpolate case 2", () => {
    const orig = setupOrig(0, 1, 2, 1);
    iupContour(1, 0, 0, orig, 0, [2, undefined, 0, undefined]);
    expect(mapArr(orig)).toEqual([2, 1, 0, 1]);
});
test("IUP test : interpolate case 3", () => {
    const orig = setupOrig(1, 0, 1, 2);
    iupContour(1, 0, 0, orig, 0, [undefined, 2, undefined, 0]);
    expect(mapArr(orig)).toEqual([1, 2, 1, 0]);
});
test("IUP test : extrapolate case", () => {
    const orig = setupOrig(0, 3, 2, 1);
    iupContour(1, 0, 0, orig, 0, [0, undefined, 2, undefined]);
    expect(mapArr(orig)).toEqual([0, 2, 2, 1]);
});
test("IUP test : same position different delta", () => {
    const orig = setupOrig(0, 3, 0, 1);
    iupContour(1, 0, 0, orig, 0, [0, undefined, 2, undefined]);
    expect(mapArr(orig)).toEqual([0, 0, 2, 0]);
});
