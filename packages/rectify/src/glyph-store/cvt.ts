import * as Ot from "@ot-builder/ot";

import { CoordRectifier } from "../interface";

export function rectifyCvtTable(rec: CoordRectifier, table: Ot.Cvt.Table) {
    return new Ot.Cvt.Table(table.items.map(x => rec.cv(x)));
}
