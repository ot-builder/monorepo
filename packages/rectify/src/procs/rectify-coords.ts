import * as Ot from "@ot-builder/ot";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import {
    AxisRectifier,
    CoordRectifier,
    IdRectifier,
    PointAttachmentRectifier
} from "../interface";

import { rectifyFont } from "./rectify-font";

type OtGlyphStore = Data.OrderStore<OtGlyph>;

export function rectifyFontCoords<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    return rectifyFont(IdRectifier, recAxes, recCoord, recPA, font);
}
