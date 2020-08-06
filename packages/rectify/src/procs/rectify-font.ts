import * as Ot from "@ot-builder/ot";

import { rectifyExtPrivate, rectifyGlyphCmap } from "../encoding";
import { rectifyCffTable } from "../glyph-store/cff";
import { rectifyCoordCvtTable } from "../glyph-store/cvt";
import { rectifyGlyphs } from "../glyph/rectify-alg";
import {
    AxisRectifier,
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier
} from "../interface";
import { rectifyBaseTable } from "../layout/base";
import { rectifyGdef } from "../layout/gdef";
import { rectifyGpos, rectifyGsub } from "../layout/gsub-gpos";
import { rectifyMathTable } from "../layout/math";
import { rectifyAxisAvar } from "../meta/avar";
import { rectifyAxisFvar } from "../meta/fvar";
import { rectifyCoordGasp } from "../meta/gasp";
import { rectifyCoordHhea, rectifyCoordVhea } from "../meta/hhea-vhea";
import { rectifyCoordOs2 } from "../meta/os2";
import { rectifyCoordPost } from "../meta/post";

export function rectifyFont<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    rectifyFontMetadata(recAxes, recCoord, font);
    rectifyCmap(recGlyphRef, font);
    rectifyGlyphs(recGlyphRef, recCoord, recPA, font);
    rectifyCoGlyphs(recGlyphRef, recCoord, font);
    rectifyLayout(recGlyphRef, recAxes, recCoord, recPA, font);
}

function rectifyCmap<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    if (font.cmap) {
        font.cmap = rectifyGlyphCmap(recGlyphRef, font.cmap);
    }
    if (font.xPrv) {
        font.xPrv = rectifyExtPrivate(recGlyphRef, font.xPrv);
    }
}
function rectifyFontMetadata<GS extends Ot.GlyphStore>(
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

function rectifyCoGlyphs<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (Ot.Font.isCff(font)) {
        font.cff = rectifyCffTable(recGlyphRef, recCoord, font.cff);
    } else {
        if (font.cvt) font.cvt = rectifyCoordCvtTable(recCoord, font.cvt);
    }
}
function rectifyLayout<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    if (font.gdef) {
        font.gdef = rectifyGdef(recGlyphRef, recCoord, recPA, font.gdef);
    }
    if (font.gsub) {
        font.gsub = rectifyGsub(recGlyphRef, recAxes, recCoord, recPA, font.gsub);
    }
    if (font.gpos) {
        font.gpos = rectifyGpos(recGlyphRef, recAxes, recCoord, recPA, font.gpos);
    }
    if (font.base) {
        font.base = rectifyBaseTable(recGlyphRef, recCoord, recPA, font.base);
    }
    if (font.math) {
        font.math = rectifyMathTable(recGlyphRef, recCoord, font.math);
    }
}
