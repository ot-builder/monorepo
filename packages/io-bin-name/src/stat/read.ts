import { Read } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { Stat } from "@ot-builder/ft-name";
import { Data } from "@ot-builder/prelude";
import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";

export const StatRead = Read(view => {
    const majorVersion = view.uint16();
    const minorVersion = view.uint16();
    Assert.SubVersionSupported("STATTable", majorVersion, minorVersion, [1, 1], [1, 2]);
    const designAxisSize = view.uint16();
    Assert.SizeMatch("STATTable::designAxisSize", designAxisSize, Tag.size + UInt16.size * 2);
    const designAxisCount = view.uint16();
    const vwAxisRecord = view.ptr32Nullable();
    const axisValueCount = view.uint16();
    const vwAxisValues = view.ptr32Nullable();
    const elidedFallbackNameID = view.uint16();

    const axes = vwAxisRecord ? vwAxisRecord.next(DesignAxisArray, designAxisCount) : [];
    const values = vwAxisValues
        ? vwAxisValues.next(AxisValueArray, axisValueCount, Data.Order.fromList(`Axes`, axes))
        : [];

    const table = new Stat.Table(axes, values, elidedFallbackNameID);
    return table;
});

const DesignAxisArray = Read((view, count: number) => {
    let arr: Stat.Axis[] = [];
    for (let aid = 0; aid < count; aid++) {
        const tag = view.next(Tag);
        const axisNameID = view.uint16();
        const axisOrdering = view.uint16();
        arr.push(new Stat.Axis(tag, axisNameID, axisOrdering));
    }
    return arr;
});

type AxisOrder = Data.Order<Stat.Axis>;
const AxisValueArray = Read((view, count: number, axes: AxisOrder) => {
    let arr: [Stat.AxisValue.General, Stat.NameAssignment][] = [];
    for (let aid = 0; aid < count; aid++) {
        arr.push(view.ptr16().next(AxisValue, axes));
    }
    return arr;
});

const AxisValue = Read((view, axes: AxisOrder) => {
    const format = view.lift(0).uint16();
    switch (format) {
        case 1:
            return view.next(AxisValueFormat1, axes);
        case 2:
            return view.next(AxisValueFormat2, axes);
        case 3:
            return view.next(AxisValueFormat3, axes);
        case 4:
            return view.next(AxisValueFormat4, axes);
        default:
            throw Errors.FormatNotSupported(`STATTable::AxisValue`, format);
    }
});

const AxisValueFormat1 = Read((view, axes: AxisOrder) => {
    const format = view.uint16();
    Assert.FormatSupported(`STATTable::AxisValueFormat1`, format, 1);
    const axisIndex = view.uint16();
    const axis = axes.at(axisIndex);
    const flags = view.uint16();
    const valueNameID = view.uint16();
    const value = view.next(F16D16);

    return ImpLib.Tuple.Tie(
        new Stat.AxisValue.Static(axis, value),
        new Stat.NameAssignment(flags, valueNameID)
    );
});

const AxisValueFormat2 = Read((view, axes: AxisOrder) => {
    const format = view.uint16();
    Assert.FormatSupported(`STATTable::AxisValueFormat2`, format, 2);
    const axisIndex = view.uint16();
    const axis = axes.at(axisIndex);
    const flags = view.uint16();
    const valueNameID = view.uint16();

    const nominalValue = view.next(F16D16);
    const rangeMinValue = view.next(F16D16);
    const rangeMaxValue = view.next(F16D16);

    return ImpLib.Tuple.Tie(
        new Stat.AxisValue.Variable(axis, rangeMinValue, nominalValue, rangeMaxValue),
        new Stat.NameAssignment(flags, valueNameID)
    );
});

const AxisValueFormat3 = Read((view, axes: AxisOrder) => {
    const format = view.uint16();
    Assert.FormatSupported(`STATTable::AxisValueFormat3`, format, 3);
    const axisIndex = view.uint16();
    const axis = axes.at(axisIndex);
    const flags = view.uint16();
    const valueNameID = view.uint16();

    const value = view.next(F16D16);
    const linkedValue = view.next(F16D16);

    return ImpLib.Tuple.Tie(
        new Stat.AxisValue.Linked(axis, value, linkedValue),
        new Stat.NameAssignment(flags, valueNameID)
    );
});

const AxisValueFormat4 = Read((view, axes: AxisOrder) => {
    const format = view.uint16();
    Assert.FormatSupported(`STATTable::AxisValueFormat4`, format, 4);
    const axisCount = view.uint16();
    const flags = view.uint16();
    const valueNameID = view.uint16();

    let assignments: [Stat.Axis, F16D16][] = [];
    for (let aid = 0; aid < axisCount; aid++) {
        const axisIndex = view.uint16();
        const axis = axes.at(axisIndex);
        const value = view.next(F16D16);
        assignments.push([axis, value]);
    }

    return ImpLib.Tuple.Tie(
        new Stat.AxisValue.PolyAxis(assignments),
        new Stat.NameAssignment(flags, valueNameID)
    );
});
