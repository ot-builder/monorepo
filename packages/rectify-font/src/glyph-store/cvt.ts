import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyCoordCvtTable(
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>,
    table: Ot.Cvt.Table
) {
    return new Ot.Cvt.Table(table.items.map(x => rec.cv(x)));
}
