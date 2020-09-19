import * as Ot from "@ot-builder/ot";

import { CoordRectifier } from "../interface";

function inPlaceRectifyHheaVheaTable(
    rec: CoordRectifier,
    newTable: Ot.MetricHead.Table,
    table: Ot.MetricHead.Table
) {
    newTable.advanceMax = table.advanceMax;
    newTable.minStartSideBearing = table.minStartSideBearing;
    newTable.minEndSideBearing = table.minEndSideBearing;
    newTable.maxExtent = table.maxExtent;
    newTable._reserved0 = table._reserved0;
    newTable._reserved1 = table._reserved1;
    newTable._reserved2 = table._reserved2;
    newTable._reserved3 = table._reserved3;
    newTable.numberOfLongMetrics = table.numberOfLongMetrics;

    newTable.ascender = rec.coord(newTable.ascender);
    newTable.descender = rec.coord(newTable.descender);
    newTable.lineGap = rec.coord(newTable.lineGap);
    newTable.caretSlopeRise = rec.coord(newTable.caretSlopeRise);
    newTable.caretSlopeRun = rec.coord(newTable.caretSlopeRun);
    newTable.caretOffset = rec.coord(newTable.caretOffset);
}

export function rectifyHheaTable(rec: CoordRectifier, table: Ot.MetricHead.Table) {
    const newTable = new Ot.MetricHead.Hhea(table.majorVersion, table.minorVersion);
    inPlaceRectifyHheaVheaTable(rec, newTable, table);
    return newTable;
}

export function rectifyVheaTable(rec: CoordRectifier, table: Ot.MetricHead.Table) {
    const newTable = new Ot.MetricHead.Vhea(table.majorVersion, table.minorVersion);
    inPlaceRectifyHheaVheaTable(rec, newTable, table);
    return newTable;
}
