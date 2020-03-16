import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Gasp } from "@ot-builder/ft-metadata";
import { OtVar } from "@ot-builder/variance";

export const GaspTableIo = {
    read(view: BinaryView) {
        const version = view.uint16();
        Assert.VersionSupported(`GaspTable`, version, 0, 1);
        const numRanges = view.uint16();
        const ranges = view.array(numRanges, GapsRange);
        return new Gasp.Table(ranges);
    },
    write(frag: Frag, table: Gasp.Table) {
        Assert.NoGap(`GaspTable::ranges`, table.ranges);
        frag.uint16(1).uint16(table.ranges.length);
        frag.array(GapsRange, table.ranges);
    }
};

const GapsRange = {
    read(view: BinaryView) {
        const rangeMaxPPEM = view.uint16();
        const rangeGaspBehavior = view.uint16();
        return new Gasp.Range(rangeMaxPPEM, rangeGaspBehavior);
    },
    write(frag: Frag, range: Gasp.Range) {
        frag.uint16(OtVar.Ops.originOf(range.maxPPEM));
        frag.uint16(range.behavior);
    }
};
