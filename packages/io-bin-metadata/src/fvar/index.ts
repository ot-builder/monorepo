import { Read, Write } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Fvar } from "@ot-builder/ft-metadata";
import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";

import { FvarReadContext } from "./context";

const AxisRecord = {
    size: 20,
    ...Read((view, index: number, ctx?: FvarReadContext) => {
        const axisTag = view.next(Tag);
        const minValue = view.next(F16D16);
        const defaultValue = view.next(F16D16);
        const maxValue = view.next(F16D16);
        const flags = view.uint16();
        const axisNameID = view.uint16();

        const rawAxis = new Fvar.Axis(axisTag, minValue, defaultValue, maxValue, flags, axisNameID);
        if (ctx && ctx.mapAxis) {
            return ctx.mapAxis(rawAxis, index);
        } else {
            return rawAxis;
        }
    }),
    ...Write((frag, axis: Fvar.Axis) => {
        frag.push(Tag, axis.tag);
        frag.push(F16D16, axis.min);
        frag.push(F16D16, axis.default);
        frag.push(F16D16, axis.max);
        frag.uint16(axis.flags);
        frag.uint16(axis.axisNameID);
    })
};

const InstanceRecord = {
    size(axesCount: number, hasPostNameID: boolean) {
        return axesCount * F16D16.size + UInt16.size * 2 + (hasPostNameID ? UInt16.size : 0);
    },
    ...Read((view, axes: Fvar.Axis[], hasPostNameID: boolean) => {
        const subfamilyNameID = view.uint16();
        const flags = view.uint16();
        const coordinates = new Map<Fvar.Axis, number>();
        for (const [p, index] of view.repeat(axes.length)) {
            coordinates.set(axes[index], view.next(F16D16));
        }
        const postScriptNameID = hasPostNameID ? view.uint16() : undefined;

        return new Fvar.Instance(subfamilyNameID, flags, coordinates, postScriptNameID);
    }),
    ...Write((frag, inst: Fvar.Instance, axes: Fvar.Axis[], hasPostNameID: boolean) => {
        frag.uint16(inst.subfamilyNameID);
        frag.uint16(inst.flags);
        for (const axis of axes) {
            frag.push(F16D16, inst.coordinates ? inst.coordinates.get(axis) || 0 : 0);
        }
        if (hasPostNameID) frag.uint16(inst.postScriptNameID || 0);
    })
};

export const FvarIo = {
    ...Read((view, context?: FvarReadContext) => {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("fvar::minorVersion", majorVersion, minorVersion, [1, 0]);
        const vwAxesArray = view.ptr16();
        const reserved1 = view.uint16();
        const axisCount = view.uint16();
        const axisSize = view.uint16();
        const instanceCount = view.uint16();
        const instanceSize = view.uint16();

        Assert.SizeMatch("fvar::axisSize", axisSize, AxisRecord.size);
        Assert.SizeMatch(
            "fvar::instanceSize",
            instanceSize,
            InstanceRecord.size(axisCount, false),
            InstanceRecord.size(axisCount, true)
        );

        const fvar = new Fvar.Table();
        const hasPostNameID = instanceSize === InstanceRecord.size(axisCount, true);

        for (const [vw, index] of vwAxesArray.repeat(axisCount)) {
            fvar.axes[index] = vw.next(AxisRecord, index, context);
        }
        for (const [vw, index] of vwAxesArray.repeat(instanceCount)) {
            fvar.instances[index] = vw.next(InstanceRecord, fvar.axes, hasPostNameID);
        }

        return fvar;
    }),
    ...Write((frag, fvar: Fvar.Table) => {
        frag.uint16(1).uint16(0);
        const frAxesArray = frag.ptr16New();
        frag.uint16(2); // Reserved 2

        Assert.NoGap(`fvar::axes`, fvar.axes);
        Assert.NoGap(`fvar::instances`, fvar.instances);

        let fHasPostScriptName = false;
        let fDoesNotHavePostScriptName = false;
        for (const instance of fvar.instances) {
            if (instance.postScriptNameID) fHasPostScriptName = true;
            else fDoesNotHavePostScriptName = true;
        }
        if (fHasPostScriptName && fDoesNotHavePostScriptName) {
            throw Errors.Fvar.MixedPostScriptNamePresence();
        }

        frag.uint16(fvar.axes.length);
        frag.uint16(AxisRecord.size);
        frag.uint16(fvar.instances.length);
        frag.uint16(InstanceRecord.size(fvar.axes.length, fHasPostScriptName));

        for (const axis of fvar.axes) {
            frAxesArray.push(AxisRecord, axis);
        }
        for (const inst of fvar.instances) {
            frAxesArray.push(InstanceRecord, inst, fvar.axes, fHasPostScriptName);
        }
    })
};
