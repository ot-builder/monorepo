import * as Ot from "@ot-builder/font";

import { CoordRectifier } from "../interface";

export function rectifyCoordCvtTable(rec: CoordRectifier, table: Ot.Cvt.Table) {
    return new Ot.Cvt.Table(table.items.map(x => rec.cv(x)));
}
