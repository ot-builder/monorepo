import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";

import { OtGhCountPoint } from "./count-point";
import { OtGhFlattener } from "./flattener";
import { OtGhGetBound } from "./get-bound";
import { OtGhPointLister } from "./point-lister";
import { OtGeometrySink, OtGeometrySinkClass, OtGeometryTraverse } from "./shared";

export namespace OtGeometryUtil {
    export type GeometrySink<T> = OtGeometrySink<T>;
    export type GeometrySinkClass<T> = OtGeometrySinkClass<T>;

    export const Flattener: OtGeometrySinkClass<OtGlyph.Point[][]> = OtGhFlattener;
    export const ListPoint: OtGeometrySinkClass<OtGlyph.Point[]> = OtGhPointLister;
    export const GetBound: OtGeometrySinkClass<OtGlyph.Stat.BoundingBox> = OtGhGetBound;
    export const CountPoint: OtGeometrySinkClass<number> = OtGhCountPoint;

    export function apply<T>(
        cls: OtGeometrySinkClass<T>,
        ...gs: Data.Maybe<OtGlyph.Geometry>[]
    ): T {
        const sink = new cls();
        const traverse = new OtGeometryTraverse(sink);
        for (const geom of gs) if (geom) traverse.process(geom);
        return sink.getResult();
    }
}
