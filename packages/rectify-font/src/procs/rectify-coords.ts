import * as Ot from "@ot-builder/font";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

import { inPlaceRectifyCoordCffTable } from "../glyph-store/cff";
import { rectifyCoordCvtTable } from "../glyph-store/cvt";
import { rectifyGlyphsCoordPA } from "../glyph/coord-alg";
import { AxisRectifier, CoordRectifier, PointAttachmentRectifier } from "../interface";
import { rectifyBaseTableCoord } from "../layout/base";
import { rectifyGdefCoords } from "../layout/gdef";
import { rectifyGposCoord, rectifyGsubCoord } from "../layout/gsub-gpos";
import { rectifyAxisAvar } from "../meta/avar";
import { rectifyAxisFvar } from "../meta/fvar";
import { rectifyCoordGasp } from "../meta/gasp";
import { rectifyCoordHhea, rectifyCoordVhea } from "../meta/hhea-vhea";
import { rectifyCoordOs2 } from "../meta/os2";
import { rectifyCoordPost } from "../meta/post";

type OtGlyphStore = Data.OrderStore<OtGlyph>;

export function rectifyFontCoords<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    rectifyFontMetadata(recAxes, recCoord, font);
    rectifyGlyphsCoordPA(recCoord, recPA, font);
    rectifyCoGlyphs(recCoord, font);
    rectifyLayout(recAxes, recCoord, recPA, font);
}

function rectifyFontMetadata<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (font.fvar) font.fvar = rectifyAxisFvar(recAxes, font.fvar);
    if (font.avar) font.avar = rectifyAxisAvar(recAxes, font.avar);
    if (font.hhea) font.hhea = rectifyCoordHhea(recCoord, font.hhea);
    if (font.vhea) font.vhea = rectifyCoordVhea(recCoord, font.vhea);
    if (font.post) font.post = rectifyCoordPost(recCoord, font.post);
    if (font.os2) font.os2 = rectifyCoordOs2(recCoord, font.os2);
    if (font.gasp) font.gasp = rectifyCoordGasp(recCoord, font.gasp);
}

function rectifyCoGlyphs<GS extends OtGlyphStore>(recCoord: CoordRectifier, font: Ot.Font<GS>) {
    if (Ot.Font.isCff(font)) {
        inPlaceRectifyCoordCffTable(recCoord, font.cff);
    } else {
        if (font.cvt) font.cvt = rectifyCoordCvtTable(recCoord, font.cvt);
    }
}
function rectifyLayout<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,

    font: Ot.Font<GS>
) {
    if (font.gdef) {
        font.gdef = rectifyGdefCoords(recCoord, recPA, font.gdef);
    }
    if (font.gsub) {
        font.gsub = rectifyGsubCoord(recAxes, recCoord, recPA, font.gsub);
    }
    if (font.gpos) {
        font.gpos = rectifyGposCoord(recAxes, recCoord, recPA, font.gpos);
    }
    if (font.base) {
        font.base = rectifyBaseTableCoord(recCoord, recPA, font.base);
    }
}
