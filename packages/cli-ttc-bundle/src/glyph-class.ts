import { Ot } from "ot-builder";

export enum GlyphClass {
    NotDef = 0,
    Space = 1 << 4,
    PostSpacePad = 2 << 4,
    Normal = 3 << 4,
    KindMask = 3 << 4,
    Simple = 1 << 1,
    CommonWidth = 1 << 2,
    CommonHeight = 1 << 3,
    VeryLast = 0xffff
}

export function decideGlyphClass(
    glyph: Ot.Glyph,
    gid: number,
    commonWidth: number,
    commonHeight: number
): GlyphClass {
    if (gid === 0) return GlyphClass.NotDef;

    if (!glyph.geometry) return GlyphClass.Space;

    let gk = GlyphClass.Normal;

    if (glyph.geometry.type === Ot.Glyph.GeometryType.ContourSet) gk |= GlyphClass.Simple;
    const advanceWidth = Ot.Var.Ops.minus(glyph.horizontal.end, glyph.horizontal.start);
    const advanceHeight = Ot.Var.Ops.minus(glyph.vertical.start, glyph.vertical.end);
    if (Ot.Var.Ops.originOf(advanceWidth) === commonWidth) gk |= GlyphClass.CommonWidth;
    if (Ot.Var.Ops.originOf(advanceHeight) === commonHeight) gk |= GlyphClass.CommonHeight;

    return gk;
}
