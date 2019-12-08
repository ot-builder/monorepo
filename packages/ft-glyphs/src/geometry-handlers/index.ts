import { OtGlyph } from "../ot-glyph";

import { OtGhCountPoint } from "./count-point";
import { OtGhGetBound } from "./get-bound";
import { OtGhPointLister } from "./point-lister";
import { StatGeometryAlgClass } from "./shared";

export {
    OtGhStdPointAttachRectifier as StdPointAttachRectifier,
    OtGhRectifyGeomPointAttachmentAlg
} from "./point-attach-rectifier";

export namespace OtGeometryHandler {
    export const ListPoint = OtGhPointLister;
    export const GetBound = OtGhGetBound;
    export const CountPoint = OtGhCountPoint;

    export function stat<T>(cls: StatGeometryAlgClass<T>, ...gs: OtGlyph.Geometry[]): T {
        const sink = new cls();
        for (const g of gs) g.acceptGeometryAlgebra(sink);
        return sink.getResult();
    }
}
