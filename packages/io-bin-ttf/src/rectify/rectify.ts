import { OtGeometryHandler, OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { OV } from "@ot-builder/variance";

export function rectifyGlyphOrder(gOrd: OtGlyphOrder) {
    let gs = new Set<OtGlyph>();
    for (const glyph of gOrd) {
        rectifyGlyph(glyph, gs);
    }
}

function rectifyGlyph(glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (gs.has(glyph)) return;

    for (const geometry of glyph.geometries) {
        if (geometry instanceof OtGlyph.TtReference) {
            consolidateRef(geometry, glyph, gs);
        }
    }

    gs.add(glyph);
}

function consolidateRef(geometry: OtGlyph.TtReference, glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (geometry.pointAttachment) {
        rectifyGlyph(geometry.to, gs);

        const zOut = OtGeometryHandler.stat(OtGeometryHandler.ListPoint, glyph)[
            geometry.pointAttachment.outer.pointIndex
        ];
        const zIn = OtGlyph.PointOps.applyTransform(
            OtGeometryHandler.stat(OtGeometryHandler.ListPoint, geometry.to)[
                geometry.pointAttachment.inner.pointIndex
            ],
            { ...geometry.transform, scaledOffset: false, dx: 0, dy: 0 }
        );
        geometry.transform = {
            ...geometry.transform,
            scaledOffset: false,
            dx: OV.minus(zOut.x, zIn.x),
            dy: OV.minus(zOut.x, zIn.x)
        };
    }
}
