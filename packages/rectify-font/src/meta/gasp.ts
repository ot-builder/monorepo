import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyCoordGasp(
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>,
    table: Ot.Gasp.Table
) {
    return new Ot.Gasp.Table(
        table.ranges.map(range => new Ot.Gasp.Range(rec.cv(range.maxPPEM), range.behavior))
    );
}
