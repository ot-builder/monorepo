import * as Ot from "@ot-builder/font";

import { CoordRectifier } from "../interface";

export function rectifyCoordGasp(rec: CoordRectifier, table: Ot.Gasp.Table) {
    return new Ot.Gasp.Table(
        table.ranges.map(range => new Ot.Gasp.Range(rec.cv(range.maxPPEM), range.behavior))
    );
}
