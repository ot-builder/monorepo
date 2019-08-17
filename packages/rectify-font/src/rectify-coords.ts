import { OtFont } from "@ot-builder/font";
import { OtGlyphStore } from "@ot-builder/ft-glyphs";
import { Fvar } from "@ot-builder/ft-metadata";
import { Rectify } from "@ot-builder/rectify";
import { OtVar } from "@ot-builder/variance";

export function rectifyFontCoords<GS extends OtGlyphStore>(
    recAxes: Rectify.Axis.RectifierT<Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<OtVar.Value>,
    font: OtFont<GS>
) {
    rectifyFontMetadata(recAxes, recCoord, font);
    rectifyGlyphs(recAxes, recCoord, font);
    rectifyCoGlyphs(recAxes, recCoord, font);
    rectifyLayout(recAxes, recCoord, font);
}

function rectifyFontMetadata<GS extends OtGlyphStore>(
    recAxes: Rectify.Axis.RectifierT<Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<OtVar.Value>,
    font: OtFont<GS>
) {
    if (font.fvar) font.fvar.rectifyAxes(recAxes);
    if (font.avar) font.avar.rectifyAxes(recAxes);
    if (font.hhea) font.hhea.rectifyCoords(recCoord);
    if (font.vhea) font.vhea.rectifyCoords(recCoord);
    if (font.post) font.post.rectifyCoords(recCoord);
    if (font.os2) font.os2.rectifyCoords(recCoord);
}
function rectifyGlyphs<GS extends OtGlyphStore>(
    recAxes: Rectify.Axis.RectifierT<Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<OtVar.Value>,
    font: OtFont<GS>
) {
    const gOrd = font.glyphs.decideOrder();
    for (const g of gOrd) g.rectifyCoords(recCoord);
}
function rectifyCoGlyphs<GS extends OtGlyphStore>(
    recAxes: Rectify.Axis.RectifierT<Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<OtVar.Value>,
    font: OtFont<GS>
) {
    if (OtFont.isCff(font)) {
        font.cff.rectifyCoords(recCoord);
    } else {
        if (font.cvt) font.cvt.rectifyCoords(recCoord);
    }
}
function rectifyLayout<GS extends OtGlyphStore>(
    recAxes: Rectify.Axis.RectifierT<Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<OtVar.Value>,
    font: OtFont<GS>
) {
    if (font.gdef) font.gdef.rectifyCoords(recCoord);
    if (font.gsub) {
        font.gsub.rectifyAxes(recAxes);
        font.gsub.rectifyCoords(recCoord);
    }
    if (font.gpos) {
        font.gpos.rectifyAxes(recAxes);
        font.gpos.rectifyCoords(recCoord);
    }
    if (font.base) font.base.rectifyCoords(recCoord);
}
