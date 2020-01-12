import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Avar } from "@ot-builder/ft-metadata";
import { F2D14 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

const AxisSegmentMapList = {
    read(view: BinaryView) {
        const positionMapCount = view.uint16();
        const asg: Avar.SegmentMap = [];
        for (let pm = 0; pm < positionMapCount; pm += 1) {
            const fromCoordinate = view.next(F2D14);
            const toCoordinate = view.next(F2D14);
            asg.push([fromCoordinate, toCoordinate]);
        }
        return asg;
    },
    write(frag: Frag, asg: Avar.SegmentMap) {
        Assert.NoGap("AvarTable::SegmentMaps", asg);
        frag.uint16(asg.length);
        for (const [from, to] of asg) {
            frag.push(F2D14, from);
            frag.push(F2D14, to);
        }
    }
};

export const AvarIo = {
    read(view: BinaryView, designSpace: OtVar.DesignSpace) {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("AvarTable", majorVersion, minorVersion, [1, 0]);
        const reserved = view.uint16();
        const axisCount = view.uint16();
        Assert.SizeMatch("AvarTable::axisCount", axisCount, designSpace.length);
        const table = new Avar.Table();
        for (let aid = 0; aid < axisCount; aid++) {
            const asg = view.next(AxisSegmentMapList);
            table.segmentMaps.set(designSpace.at(aid), asg);
        }
        return table;
    },
    write(frag: Frag, avar: Avar.Table, designSpace: OtVar.DesignSpace) {
        frag.uint16(1) // majorVersion
            .uint16(0) // minorVersion
            .uint16(0); // reserved
        frag.uint16(designSpace.length);
        for (const dim of designSpace) {
            const asg = avar.segmentMaps.get(dim);
            if (asg) {
                frag.push(AxisSegmentMapList, asg);
            } else {
                throw Errors.Avar.MissingMapping(dim.tag);
            }
        }
    }
};
