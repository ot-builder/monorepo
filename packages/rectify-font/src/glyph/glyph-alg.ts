import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export class RectifyGeomGlyphAlg implements Ot.Glyph.GeometryAlg<null | Ot.Glyph.Geometry> {
    constructor(private readonly rec: Rectify.Glyph.RectifierT<Ot.Glyph>) {}
    public empty() {
        return null;
    }
    public contourSet(cs: Ot.Glyph.ContourSetProps) {
        return Ot.Glyph.ContourSet.create(cs.contours);
    }
    public geometryList(children: (null | Ot.Glyph.Geometry)[]) {
        const meaningful: Ot.Glyph.Geometry[] = [];
        for (const item of children) if (item) meaningful.push(item);
        if (!meaningful.length) return null;
        return Ot.Glyph.GeometryList.create(meaningful);
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps) {
        const to1 = this.rec.glyph(ref.to);
        if (!to1) return null;

        const ref1 = Ot.Glyph.TtReference.create(to1, ref.transform);
        ref1.roundXyToGrid = ref.roundXyToGrid;
        ref1.useMyMetrics = ref.useMyMetrics;
        ref1.overlapCompound = ref.overlapCompound;
        ref1.pointAttachment = ref.pointAttachment;
        return ref1;
    }
}
