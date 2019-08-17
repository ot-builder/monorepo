import { Frag, FragPointerEmbedding, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Stat } from "@ot-builder/ft-name";
import { Data } from "@ot-builder/prelude";
import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";

export const StatWrite = Write((frag, stat: Stat.Table) => {
    const stValueRecordOffset = new Data.State<number>(0);
    const stNeedFormat12 = new Data.State(false);
    const body = Frag.from(StatTableBody, stat, stValueRecordOffset, stNeedFormat12);

    frag.uint16(1)
        .uint16(stNeedFormat12.get() ? 2 : 1)
        .uint16(Tag.size + UInt16.size * 2)
        .uint16(stat.designAxes.length)
        .ptr32(body)
        .uint16(stat.assignments.length)
        .ptr32(body, FragPointerEmbedding.Relative, stValueRecordOffset.get())
        .uint16(stat.elidedFallbackNameID);
});

const StatTableBody = Write(
    (
        frag,
        stat: Stat.Table,
        acValueRecordOffset: Data.Access<number>,
        acNeedFormat12: Data.Access<boolean>
    ) => {
        const start = frag.size;
        frag.push(DesignAxisArray, stat.designAxes);
        acValueRecordOffset.set(frag.size - start);
        frag.embed(
            Frag.from(
                AxisValueArray,
                stat.assignments,
                Data.Order.fromList(`DesignAxes`, stat.designAxes),
                acNeedFormat12
            )
        );
    }
);

const DesignAxisArray = Write((frag, axes: ReadonlyArray<Stat.Axis>) => {
    for (const axis of axes) frag.push(DesignAxisRecord, axis);
});
const DesignAxisRecord = Write((frag, axis: Stat.Axis) => {
    frag.push(Tag, axis.tag)
        .uint16(axis.axisNameID)
        .uint16(axis.axisOrdering);
});

type AxisOrder = Data.Order<Stat.Axis>;
const AxisValueArray = Write(
    (
        frag,
        ava: ReadonlyArray<[Stat.AxisValue.General, Stat.NameAssignment]>,
        axes: AxisOrder,
        acNeedFormat12: Data.Access<boolean>
    ) => {
        for (let item of ava) {
            frag.ptr16New(FragPointerEmbedding.EmbedRelative).push(
                AxisValue,
                item,
                axes,
                acNeedFormat12
            );
        }
    }
);
const AxisValue = Write(
    (
        frag,
        [av, asg]: [Stat.AxisValue.General, Stat.NameAssignment],
        axes: AxisOrder,
        acNeedFormat12: Data.Access<boolean>
    ) => {
        if (av instanceof Stat.AxisValue.Static) {
            frag.push(AxisValueFormat1, [av, asg], axes);
        } else if (av instanceof Stat.AxisValue.Variable) {
            frag.push(AxisValueFormat2, [av, asg], axes);
        } else if (av instanceof Stat.AxisValue.Linked) {
            frag.push(AxisValueFormat3, [av, asg], axes);
        } else if (av instanceof Stat.AxisValue.PolyAxis) {
            acNeedFormat12.set(true);
            frag.push(AxisValueFormat4, [av, asg], axes);
        } else {
            throw Errors.STAT.UnknownAxisValueFormat();
        }
    }
);

const AxisValueFormat1 = Write(
    (frag, [av, asg]: [Stat.AxisValue.Static, Stat.NameAssignment], axes: AxisOrder) => {
        frag.uint16(1)
            .uint16(axes.reverse(av.axis))
            .uint16(asg.flags)
            .uint16(asg.valueNameID)
            .push(F16D16, av.value);
    }
);
const AxisValueFormat2 = Write(
    (frag, [av, asg]: [Stat.AxisValue.Variable, Stat.NameAssignment], axes: AxisOrder) => {
        frag.uint16(2)
            .uint16(axes.reverse(av.axis))
            .uint16(asg.flags)
            .uint16(asg.valueNameID)
            .push(F16D16, av.nominal)
            .push(F16D16, av.min)
            .push(F16D16, av.max);
    }
);
const AxisValueFormat3 = Write(
    (frag, [av, asg]: [Stat.AxisValue.Linked, Stat.NameAssignment], axes: AxisOrder) => {
        frag.uint16(3)
            .uint16(axes.reverse(av.axis))
            .uint16(asg.flags)
            .uint16(asg.valueNameID)
            .push(F16D16, av.value)
            .push(F16D16, av.linkedValue);
    }
);
const AxisValueFormat4 = Write(
    (frag, [av, asg]: [Stat.AxisValue.PolyAxis, Stat.NameAssignment], axes: AxisOrder) => {
        frag.uint16(4)
            .uint16(av.assignments.length)
            .uint16(asg.flags)
            .uint16(asg.valueNameID);
        for (const [axis, value] of av.assignments) {
            frag.uint16(axes.reverse(axis)).push(F16D16, value);
        }
    }
);
