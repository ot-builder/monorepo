import { Read, Write } from "@ot-builder/bin-util";
import { MetricHead } from "@ot-builder/ft-metadata";
import { OtVar } from "@ot-builder/variance";

export const MetricHeadIo = {
    ...Read((view, vertical: boolean) => {
        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        const table: MetricHead.Table = vertical
            ? new MetricHead.Vhea(majorVersion, minorVersion)
            : new MetricHead.Hhea(majorVersion, minorVersion);
        table.ascender = view.int16();
        table.descender = view.int16();
        table.lineGap = view.int16();
        table.advanceMax = view.uint16();
        table.minStartSideBearing = view.int16();
        table.minEndSideBearing = view.int16();
        table.maxExtent = view.int16();
        table.caretSlopeRise = view.int16();
        table.caretSlopeRun = view.int16();
        table.caretOffset = view.int16();
        table._reserved0 = view.int16();
        table._reserved1 = view.int16();
        table._reserved2 = view.int16();
        table._reserved3 = view.int16();
        table.numberOfLongMetrics = view.uint16();

        return table;
    }),
    ...Write((frag, table: MetricHead.Table) => {
        frag.uint16(table.majorVersion);
        frag.uint16(table.minorVersion);
        frag.int16(Math.round(OtVar.Ops.originOf(table.ascender)));
        frag.int16(Math.round(OtVar.Ops.originOf(table.descender)));
        frag.int16(Math.round(OtVar.Ops.originOf(table.lineGap)));
        frag.uint16(table.advanceMax);
        frag.int16(table.minStartSideBearing);
        frag.int16(table.minEndSideBearing);
        frag.int16(table.maxExtent);
        frag.int16(Math.round(OtVar.Ops.originOf(table.caretSlopeRise)));
        frag.int16(Math.round(OtVar.Ops.originOf(table.caretSlopeRun)));
        frag.int16(Math.round(OtVar.Ops.originOf(table.caretOffset)));
        frag.int16(table._reserved0);
        frag.int16(table._reserved1);
        frag.int16(table._reserved2);
        frag.int16(table._reserved3);
        frag.int16(table.metricDataFormat);
        frag.uint16(table.numberOfLongMetrics);
    })
};
