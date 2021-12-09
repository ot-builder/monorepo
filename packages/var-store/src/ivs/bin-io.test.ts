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
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 2], [Wide, 1]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 2], [Wide, 4]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 1]));
    ivs.valueToInnerOuterID(cr.make(100, [Bold, 5], [Wide, 6], [Corner, 3]));
    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth])
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 2], [Wide, 1]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 1), cr.make(0, [Bold, 2], [Wide, 4]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(1, 0), cr.make(0, [Bold, 1], [Wide, 0]))).toBe(true);
    expect(
        OtVar.Ops.equal(ivs1.queryValue(2, 0), cr.make(0, [Bold, 5], [Wide, 6], [Corner, 3]))
    ).toBe(true);
});

test("IVS roundtrip -- Multiple Values", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);
    ivs.multiValueToInnerOuterID([
        cr.make(0, [Bold, 1], [Wide, 1]),
        cr.make(0, [Bold, 1], [Wide, 2])
    ]);
    ivs.multiValueToInnerOuterID([
        cr.make(0, [Bold, 1], [Wide, 1]),
        cr.make(0, [Bold, 1], [Wide, 2])
    ]);
    ivs.multiValueToInnerOuterID([
        cr.make(0, [Bold, 1], [Wide, 1]),
        cr.make(0, [Bold, 1], [Wide, 3])
    ]);
    ivs.valueToInnerOuterID(cr.make(0, [Bold, 1], [Wide, 1]));

    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth])
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 1], [Wide, 1]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 1), cr.make(0, [Bold, 1], [Wide, 2]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 2), cr.make(0, [Bold, 1], [Wide, 1]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(0, 3), cr.make(0, [Bold, 1], [Wide, 3]))).toBe(true);
    expect(OtVar.Ops.equal(ivs1.queryValue(1, 0), cr.make(0, [Bold, 1], [Wide, 1]))).toBe(true);
});

test("IVS roundtrip -- overflow handling", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);

    const pairs: [{ outer: number; inner: number }, OtVar.Value][] = [];
    for (let p = 0; p < 0x100; p++) {
        for (let q = 0; q < 0x100; q++) {
            const v = cr.make(0, [Bold, 1 + p], [Wide, 1 + q]);
            pairs.push([ivs.valueToInnerOuterID(v)!, v]);
        }
    }

    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth]),
        allowLongDeltas: true
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    for (const [{ outer, inner }, v] of pairs) {
        expect(OtVar.Ops.equal(ivs1.queryValue(outer, inner), v)).toBeTruthy();
    }
});

test("IVS roundtrip -- Long deltas", () => {
    const mc = new OtVar.MasterSet();
    const cr = new OtVar.ValueFactory(mc);
    const ivs = WriteTimeIVS.create(mc);
    ivs.valueToInnerOuterID(cr.make(100000, [Bold, 100], [Wide, 500]));
    ivs.longValueToInnerOuterID(cr.make(100000, [Bold, 100000], [Wide, 500000]));
    ivs.longValueToInnerOuterID(cr.make(100000, [Bold, 100], [Wide, 500]));
    const frag = new Frag().push(WriteTimeIVS, ivs, {
        designSpace: ImpLib.Order.fromList("Axes", [Wght, Wdth]),
        allowLongDeltas: true
    });
    const ivs1 = new BinaryView(Frag.pack(frag)).next(
        ReadTimeIVS,
        ImpLib.Order.fromList("Axes", [Wght, Wdth])
    );

    expect(
        OtVar.Ops.equal(ivs1.queryValue(0, 0), cr.make(0, [Bold, 100], [Wide, 500]))
    ).toBeTruthy();
    expect(
        OtVar.Ops.equal(ivs1.queryValue(1, 0), cr.make(0, [Bold, 100000], [Wide, 500000]))
    ).toBeTruthy();
    expect(
        OtVar.Ops.equal(ivs1.queryValue(1, 1), cr.make(0, [Bold, 100], [Wide, 500]))
    ).toBeTruthy();
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
    col.getIVD(false, 1);

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
