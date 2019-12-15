import * as Ot from "@ot-builder/font";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

import { inPlaceRectifyCoordCffTable } from "./glyph-store/cff";
import { rectifyCoordCvtTable } from "./glyph-store/cvt";
import { RectifyGeomCoordAlg, RectifyHintCoordAlg } from "./glyph/coord-alg";
import { rectifyGlyphsPA } from "./glyph/point-attachment-alg";
import { AxisRectifier, CoordRectifier, PointAttachmentRectifier } from "./interface";
import { rectifyBaseTableCoord, rectifyBaseTablePointAttachment } from "./layout/base";
import { rectifyGdefCoords, rectifyGdefPointAttachment } from "./layout/gdef";
import { rectifyLayoutCoord, rectifyLayoutPointAttachment } from "./layout/gsub-gpos";
import { rectifyAxisAvar } from "./meta/avar";
import { rectifyAxisFvar } from "./meta/fvar";
import { rectifyCoordGasp } from "./meta/gasp";
import { rectifyCoordHhea, rectifyCoordVhea } from "./meta/hhea-vhea";
import { rectifyCoordOs2 } from "./meta/os2";
import { rectifyCoordPost } from "./meta/post";

type OtGlyphStore = Data.OrderStore<OtGlyph>;

export function rectifyFontCoords<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    rectifyFontMetadata(recAxes, recCoord, font);
    rectifyGlyphs(recAxes, recCoord, font);
    rectifyCoGlyphs(recAxes, recCoord, font);
    rectifyLayout(recAxes, recCoord, font);

    rectifyGlyphsPA(recPA, font);
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
function rectifyGlyphs<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    const gOrd = font.glyphs.decideOrder();
    const algGeom = new RectifyGeomCoordAlg(recCoord);
    const algHints: Ot.Glyph.HintAlg<null | Ot.Glyph.Hint> = new RectifyHintCoordAlg(recCoord);

    for (const g of gOrd) {
        if (g.geometry) g.geometry = g.geometry.acceptGeometryAlgebra(algGeom);
        if (g.hints) g.hints = g.hints.acceptHintAlgebra(algHints);
        g.horizontal = {
            start: recCoord.coord(g.horizontal.start),
            end: recCoord.coord(g.horizontal.end)
        };
        g.vertical = {
            start: recCoord.coord(g.vertical.start),
            end: recCoord.coord(g.vertical.end)
        };
    }
}

function rectifyCoGlyphs<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (Ot.Font.isCff(font)) {
        inPlaceRectifyCoordCffTable(recCoord, font.cff);
    } else {
        if (font.cvt) font.cvt = rectifyCoordCvtTable(recCoord, font.cvt);
    }
}
function rectifyLayout<GS extends OtGlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (font.gdef) {
        font.gdef = rectifyGdefCoords(font.gdef, recCoord);
    }
    if (font.gsub) {
        font.gsub = rectifyLayoutCoord(font.gsub, () => new Ot.Gsub.Table(), recAxes, recCoord);
    }
    if (font.gpos) {
        font.gpos = rectifyLayoutCoord(font.gpos, () => new Ot.Gpos.Table(), recAxes, recCoord);
    }
    if (font.base) {
        font.base = rectifyBaseTableCoord(recCoord, font.base);
    }
}
function rectifyLayoutPA<GS extends OtGlyphStore>(
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    if (font.gdef) {
        font.gdef = rectifyGdefPointAttachment(font.gdef, recPA);
    }
    if (font.gsub) {
        font.gsub = rectifyLayoutPointAttachment(font.gsub, () => new Ot.Gsub.Table(), recPA);
    }
    if (font.gpos) {
        font.gpos = rectifyLayoutPointAttachment(font.gpos, () => new Ot.Gpos.Table(), recPA);
    }
    if (font.base) {
        font.base = rectifyBaseTablePointAttachment(recPA, font.base);
    }
}
