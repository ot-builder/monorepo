import { OtGeometryHandler, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export function rectifyGlyphOrder(gOrd: Data.Order<OtGlyph>) {
    let gs = new Set<OtGlyph>();
    for (const glyph of gOrd) {
        rectifyGlyph(glyph, gs);
    }
}

function rectifyGlyph(glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (gs.has(glyph)) return;

    const geometry = glyph.geometry;
    if (geometry && geometry instanceof OtGlyph.TtReferenceList) {
        for (const ref of geometry.references) consolidateRef(ref, glyph, gs);
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
            dx: OtVar.Ops.minus(zOut.x, zIn.x),
            dy: OtVar.Ops.minus(zOut.x, zIn.x)
        };
    }
}
