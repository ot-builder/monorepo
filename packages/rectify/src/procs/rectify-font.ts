import * as Ot from "@ot-builder/ot";

import { rectifyCmapTable, rectifyExtPrivateTable } from "../encoding";
import { inPlaceRectifyGlyphStore } from "../glyph";
import { rectifyCffTable } from "../glyph-store/cff";
import { rectifyCvtTable } from "../glyph-store/cvt";
import {
    AxisRectifier,
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier
} from "../interface";
import { rectifyBaseTable } from "../layout/base";
import { rectifyGdefTable } from "../layout/gdef";
import { rectifyGposTable, rectifyGsubTable } from "../layout/gsub-gpos";
import { rectifyMathTable } from "../layout/math";
import { rectifyAvarTable } from "../meta/avar";
import { rectifyFvarTable } from "../meta/fvar";
import { rectifyGaspTable } from "../meta/gasp";
import { rectifyHheaTable, rectifyVheaTable } from "../meta/hhea-vhea";
import { rectifyOs2Table } from "../meta/os2";
import { rectifyPostTable } from "../meta/post";
import { rectifyTSI0123Table, rectifyTSI5Table } from "../private/vtt";

export function inPlaceRectifyFont<GS extends Ot.GlyphStore>(
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
    rectifyPrivate(recGlyphRef, font);
}

function rectifyCmap<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    font: Ot.Font<GS>
) {
    if (font.cmap) {
        font.cmap = rectifyCmapTable(recGlyphRef, font.cmap);
    }
    if (font.xPrv) {
        font.xPrv = rectifyExtPrivateTable(recGlyphRef, font.xPrv);
    }
}
function rectifyFontMetadata<GS extends Ot.GlyphStore>(
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (font.fvar) font.fvar = rectifyFvarTable(recAxes, font.fvar);
    if (font.avar) font.avar = rectifyAvarTable(recAxes, font.avar);
    if (font.hhea) font.hhea = rectifyHheaTable(recCoord, font.hhea);
    if (font.vhea) font.vhea = rectifyVheaTable(recCoord, font.vhea);
    if (font.post) font.post = rectifyPostTable(recCoord, font.post);
    if (font.os2) font.os2 = rectifyOs2Table(recCoord, font.os2);
    if (font.gasp) font.gasp = rectifyGaspTable(recCoord, font.gasp);
}
function rectifyGlyphs<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    font: Ot.Font<GS>
) {
    inPlaceRectifyGlyphStore(recGlyphRef, recCoord, recPA, font.glyphs);
}
function rectifyCoGlyphs<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    font: Ot.Font<GS>
) {
    if (Ot.Font.isCff(font)) {
        font.cff = rectifyCffTable(recGlyphRef, recCoord, font.cff);
    } else {
        if (font.cvt) font.cvt = rectifyCvtTable(recCoord, font.cvt);
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
        font.gdef = rectifyGdefTable(recGlyphRef, recCoord, recPA, font.gdef);
    }
    if (font.gsub) {
        font.gsub = rectifyGsubTable(recGlyphRef, recAxes, recCoord, recPA, font.gsub);
    }
    if (font.gpos) {
        font.gpos = rectifyGposTable(recGlyphRef, recAxes, recCoord, recPA, font.gpos);
    }
    if (font.base) {
        font.base = rectifyBaseTable(recGlyphRef, recCoord, recPA, font.base);
    }
    if (font.math) {
        font.math = rectifyMathTable(recGlyphRef, recCoord, font.math);
    }
}
function rectifyPrivate<GS extends Ot.GlyphStore>(
    recGlyphRef: GlyphReferenceRectifier,

    font: Ot.Font<GS>
) {
    if (font.tsi01) {
        font.tsi01 = rectifyTSI0123Table(recGlyphRef, font.tsi01);
    }
    if (font.tsi23) {
        font.tsi23 = rectifyTSI0123Table(recGlyphRef, font.tsi23);
    }
    if (font.tsi5) {
        font.tsi5 = rectifyTSI5Table(recGlyphRef, font.tsi5);
    }
}
