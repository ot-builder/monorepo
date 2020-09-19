import * as Ot from "@ot-builder/ot";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import {
    AxisRectifier,
    CoordRectifier,
    IdAxisRectifier,
    IdCoordRectifier,
    IdGlyphRefRectifier,
    IdPointAttachmentRectifier,
    PointAttachmentRectifier
} from "../interface";

import { inPlaceRectifyFont } from "./rectify-font";

type OtGlyphStore = Data.OrderStore<OtGlyph>;

export function inPlaceRectifyFontAxes<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    font: Ot.Font<GS>
) {
    return inPlaceRectifyFont(
        IdGlyphRefRectifier,
        recAxes,
        IdCoordRectifier,
        IdPointAttachmentRectifier,
        font
    );
}
export function inPlaceRectifyFontCoords<GS extends OtGlyphStore>(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    return inPlaceRectifyFont(IdGlyphRefRectifier, IdAxisRectifier, recCoord, recPA, font);
}
