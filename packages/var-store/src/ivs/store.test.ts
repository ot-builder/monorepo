import { OtVar } from "@ot-builder/variance";

import { WriteTimeIVS } from "./impl";

const Wght: OtVar.Axis = {
    tag: "wght",
    min: 100,
    default: 400,
    max: 900
};
const Wdth: OtVar.Axis = {
    tag: "wdth",
    min: 25,
    default: 100,
    max: 200
};
const Bold = OtVar.Create.Master([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold1 = OtVar.Create.Master([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: -1, peak: 0, max: 1 }
]);
const Bold2 = OtVar.Create.Master([
    { axis: Wdth, min: -1, peak: 0, max: 1 },
    { axis: Wght, min: 0, peak: 1, max: 1 }
]);
const Wide = OtVar.Create.Master([
    { axis: Wght, min: -1, peak: 0, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);
const Corner = OtVar.Create.Master([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);

test("Write time IVS : Value management", () => {
    const mc = OtVar.Create.MasterSet();
    const cr = OtVar.Ops.Creator(mc);
    const ivs = WriteTimeIVS.create(mc);

    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 100]))
    );
    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold, 50], [Bold1, 50], [Bold2, 50], [Wide, 100]))
    );
    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 100]))
    );
    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold1, 150], [Wide, 100]))
    );
    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold2, 150], [Wide, 100]))
    );
    expect({ outer: 0, inner: 0 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Wide, 100], [Bold2, 150]))
    );
    expect({ outer: 0, inner: 1 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 200]))
    );
    expect({ outer: 1, inner: 0 }).toEqual(ivs.valueToInnerOuterID(cr.make(100, [Bold, 100])));
    expect(null).toEqual(ivs.valueToInnerOuterID(cr.make(100)));
});

test("Write time IVS : Value management with overflow", () => {
    const mc = OtVar.Create.MasterSet();
    const cr = OtVar.Ops.Creator(mc);
    const ivs = WriteTimeIVS.create(mc);

    for (let p = 0; p < 0x100; p++) {
        for (let q = 0; q < 0x100; q++) {
            ivs.valueToInnerOuterID(cr.make(0, [Bold, 1 + p], [Wide, 1 + q]));
        }
    }

    expect({ outer: 1, inner: 16 }).toEqual(
        ivs.valueToInnerOuterID(cr.make(100, [Bold, -1], [Wide, -1]))
    );
});

test("Write time IVS : Master-only management (CFF2-ish)", () => {
    const mc = OtVar.Create.MasterSet();
    const cr = OtVar.Ops.Creator(mc);
    const ivs = WriteTimeIVS.create(mc);
    const col = ivs.createCollector();
    const d1 = col.collect(cr.make(100, [Bold, 150], [Wide, 100]));
    const d2 = col.collect(cr.make(100, [Bold1, 150], [Wide, 100]));
    const d3 = col.collect(cr.make(100, [Bold2, 123], [Wide, 456]));
    const d4 = col.collect(cr.make(100, [Corner, 50]));

    const ivd = col.getIVD()!;
    expect(col.size).toBe(3); // 3 meaningful masters
    expect(ivd.masterIDs).toEqual([0, 1, 2]);
    expect(d1.resolve()).toEqual([150, 100, 0]);
    expect(d3.resolve()).toEqual([123, 456, 0]);
    expect(d4.resolve()).toEqual([0, 0, 50]);
});
