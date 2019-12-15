import { Data } from "@ot-builder/prelude/src";

import { OtGlyph } from "../ot-glyph";

import { OtGhCountPoint } from "./count-point";
import { OtGhGetBound } from "./get-bound";
import { OtGhPointLister } from "./point-lister";
import { StatGeometryAlgClass } from "./shared";

export namespace OtGeometryHandler {
    export const ListPoint = OtGhPointLister;
    export const GetBound = OtGhGetBound;
    export const CountPoint = OtGhCountPoint;

    export function stat<T>(
        cls: StatGeometryAlgClass<T>,
        ...gs: Data.Maybe<OtGlyph.Geometry>[]
    ): T {
        const sink = new cls();
        for (const g of gs) if (g) g.acceptGeometryAlgebra(sink);
        return sink.getResult();
    }
}
