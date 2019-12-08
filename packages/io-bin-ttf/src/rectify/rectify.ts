import {
    OtGhRectifyGeomPointAttachmentAlg,
    OtGlyph,
    StdPointAttachRectifier
} from "@ot-builder/ft-glyphs";
import { Data, Rectify } from "@ot-builder/prelude";

export function rectifyGlyphOrder(gOrd: Data.Order<OtGlyph>) {
    let gs = new Set<OtGlyph>();
    for (const glyph of gOrd) {
        rectifyGlyph(glyph, gs);
    }
}

function rectifyGlyph(glyph: OtGlyph, gs: Set<OtGlyph>) {
    if (gs.has(glyph)) return;

    if (glyph.geometry) {
        glyph.geometry = glyph.geometry.acceptGeometryAlgebra(
            new OtGhRectifyGeomPointAttachmentAlg(
                new StdPointAttachRectifier(Rectify.PointAttach.Manner.TrustAttachment),
                glyph
            )
        );
    }

    gs.add(glyph);
}
