import * as Ot from "@ot-builder/ot";

export function inPlaceTransformFontGlyph<GS extends Ot.GlyphStore>(
    font: Ot.Font<GS>,
    transform: Ot.Glyph.Transform2X3
) {
    for (const g of font.glyphs.decideOrder()) {
        const flattened = Ot.GlyphGeometryUtil.apply(Ot.GlyphGeometryUtil.Flattener, g.geometry);
        g.geometry = new Ot.Glyph.ContourSet(flattened);
    }
    for (const g of font.glyphs.decideOrder()) {
        if (!g.geometry || g.geometry.type !== Ot.Glyph.GeometryType.ContourSet) continue;
        for (const c of g.geometry.contours) {
            for (let iz = 0; iz < c.length; iz++) {
                c[iz] = Ot.Glyph.PointOps.applyTransform(c[iz], transform);
            }
        }
    }
}
