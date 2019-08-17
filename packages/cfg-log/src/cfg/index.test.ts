import { Config } from "./index";

test("Config.with tests", () => {
    const cfg = Config.create({ a: 1 });
    const cfg1 = cfg.with({ b: 2 });
    expect(cfg.a).toBe(1);
    expect(Object.keys(cfg)).toEqual(["a"]);
    expect(cfg1.b).toBe(2);
    expect(Object.keys(cfg1)).toEqual(["a", "b"]);
});
