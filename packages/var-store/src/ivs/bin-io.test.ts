import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { ReadTimeIVS, WriteTimeIVS } from "./impl";

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
const Wide = OtVar.Create.Master([
    { axis: Wght, min: -1, peak: 0, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);
const Corner = OtVar.Create.Master([
    { axis: Wght, min: 0, peak: 1, max: 1 },
    { axis: Wdth, min: 0, peak: 1, max: 1 }
]);

test("IVS roundtrip -- Traditional", () => {
    const mc = OtVar.Create.MasterSet();
    const cr = OtVar.Ops.Creator(mc);
    const ivs = WriteTimeIVS.create(mc);
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 100]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 200]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 100]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, -10], [Wide, 20], [Corner, 3]));
    const frag = new Frag().push(WriteTimeIVS, ivs, Data.Order.fromList("Axes", [Wght, Wdth]));
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        Data.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 150], [Wide, 100]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 1), cr.make(0, [Bold, 150], [Wide, 200]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(1, 0), cr.make(0, [Bold, 100], [Wide, 0]))).toBe(true);
    expect(
        OtVar.Ops.equal(ivs1.queryValue(2, 0), cr.make(0, [Bold, -10], [Wide, 20], [Corner, 3]))
    ).toBe(true);
});

test("IVS roundtrip -- Master only (CFF2-ish)", () => {
    const mc = OtVar.Create.MasterSet();
    const cr = OtVar.Ops.Creator(mc);
    const ivs = WriteTimeIVS.create(mc);
    const col = ivs.createCollector();
    col.collect(cr.make(100, [Bold, 150], [Wide, 100]));
    col.collect(cr.make(100, [Bold, 150], [Wide, 200]));
    col.collect(cr.make(100, [Bold, 100]));
    col.collect(cr.make(100, [Bold, -10], [Wide, 20], [Corner, 3]));
    col.getIVD();

    const frag = new Frag().push(WriteTimeIVS, ivs, Data.Order.fromList("Axes", [Wght, Wdth]));
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        Data.Order.fromList("Axes", [Wght, Wdth])
    );
    const ivd = ivs1.getIVD(0);
    expect(
        OtVar.Ops.equal(
            ivs1.buildValue(ivd, [123, 456, 789]),
            cr.make(0, [Bold, 123], [Wide, 456], [Corner, 789])
        )
    ).toBe(true);
});
