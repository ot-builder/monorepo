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

import { rectifyFont } from "./rectify-font";

type OtGlyphStore = Data.OrderStore<OtGlyph>;

export function rectifyFontAxes<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(
        IdGlyphRefRectifier,
        recAxes,
        IdCoordRectifier,
        IdPointAttachmentRectifier,
        font
    );
}
export function rectifyFontCoords<GS extends OtGlyphStore>(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(IdGlyphRefRectifier, IdAxisRectifier, recCoord, recPA, font);
}
