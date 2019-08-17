import { PathMap } from "./path-map";

test("Path map test", () => {
    const map = new PathMap<number, number>();
    map.set([1, 2, 3], 1);
    map.set([2, 3, 4], 2);

    expect(map.get([])).toBe(undefined);
    expect(map.get([1, 2, 3])).toBe(1);
    expect(map.get([1, 2])).toBe(undefined);
    expect(map.get([1, 2, 3, 4])).toBe(undefined);
    expect(map.get([2, 3, 4])).toBe(2);
});
