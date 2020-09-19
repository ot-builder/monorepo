import * as Ot from "@ot-builder/ot";

import { CoordRectifier } from "../interface";

export function rectifyPostTable(rec: CoordRectifier, table: Ot.Post.Table) {
    const newTable = new Ot.Post.Table(table.majorVersion, table.minorVersion);
    newTable.italicAngle = table.italicAngle;
    newTable.underlinePosition = rec.coord(table.underlinePosition);
    newTable.underlineThickness = rec.coord(table.underlineThickness);
    newTable.isFixedPitch = table.isFixedPitch;
    newTable.minMemType42 = table.minMemType42;
    newTable.maxMemType42 = table.maxMemType42;
    newTable.minMemType1 = table.minMemType1;
    newTable.maxMemType1 = table.maxMemType1;
    return newTable;
}
