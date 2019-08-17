import { Num } from "./number-impl";

test("Ring & VectorSpace impl for Number", () => {
    expect(Num.add(1, 2)).toBe(1 + 2);
    expect(Num.addScale(1, 2, 3)).toBe(1 + 2 * 3);
});
