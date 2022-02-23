import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";
import { BoundingBox } from "../ot-glyph/stat";

import { OtGhCountPoint } from "./count-point";
import { OtGhFlattener } from "./flattener";
import { OtGhGetBound } from "./get-bound";
import { OtGhPointLister } from "./point-lister";
import { StatGeometryAlgClass } from "./shared";

export namespace OtGeometryHandler {
    export const Flattener: StatGeometryAlgClass<OtGlyph.Point[][]> = OtGhFlattener;
    export const ListPoint: StatGeometryAlgClass<OtGlyph.Point[]> = OtGhPointLister;
    export const GetBound: StatGeometryAlgClass<BoundingBox> = OtGhGetBound;
    export const CountPoint: StatGeometryAlgClass<number> = OtGhCountPoint;

    export function apply<T>(
        cls: StatGeometryAlgClass<T>,
        ...gs: Data.Maybe<OtGlyph.Geometry>[]
    ): T {
        const sink = new cls();
        for (const g of gs) if (g) sink.process(g);
        return sink.getResult();
    }
}
