import { BinaryView, Frag } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { OtVar } from "@ot-builder/variance";

import { ReadTimeIVS, WriteTimeIVS } from "./impl";

const Wght = new OtVar.Dim("wght", 100, 400, 900);
const Wdth = new OtVar.Dim("wdth", 25, 100, 200);
const Bold = new OtVar.Master([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: -1, peak: 0, max: 1 }
]);
const Wide = new OtVar.Master([
    { dim: Wght, min: -1, peak: 0, max: 1 },
    { dim: Wdth, min: 0, peak: 1, max: 1 }
]);
const Corner = new OtVar.Master([
    { dim: Wght, min: 0, peak: 1, max: 1 },
    { dim: Wdth, min: 0, peak: 1, max: 1 }
]);

test("IVS roundtrip -- Traditional", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 100]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 150], [Wide, 200]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 100]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, -10], [Wide, 20], [Corner, 3]));
    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth])
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 150], [Wide, 100]))).toBe(
        true
    );
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 1), cr.make(0, [Bold, 150], [Wide, 200]))).toBe(
        true
    );
    expect(OtVar.Ops.equal(ivs1.queryValue(1, 0), cr.make(0, [Bold, 100], [Wide, 0]))).toBe(true);
    expect(
        OtVar.Ops.equal(ivs1.queryValue(2, 0), cr.make(0, [Bold, -10], [Wide, 20], [Corner, 3]))
    ).toBe(true);
});

test("IVS roundtrip -- Long deltas", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);
    ivs.valueToInnerOuterID(cr.make(100000, [Bold, 100000], [Wide, 500000]));
    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth]),
        allowLongDeltas: true
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(
        OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 100000], [Wide, 500000]))
    ).toBe(true);
});

test("IVS roundtrip -- Master only (CFF2-ish)", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);
    const col = ivs.createCollector();
    col.collect(cr.make(100, [Bold, 150], [Wide, 100]));
    col.collect(cr.make(100, [Bold, 150], [Wide, 200]));
    col.collect(cr.make(100, [Bold, 100]));
    col.collect(cr.make(100, [Bold, -10], [Wide, 20], [Corner, 3]));
    col.getIVD();

    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth])
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );
    const ivd = ivs1.getIVD(0);
    expect(
        OtVar.Ops.equal(
            ivs1.buildValue(ivd, [123, 456, 789]),
            cr.make(0, [Bold, 123], [Wide, 456], [Corner, 789])
        )
    ).toBe(true);
});
