import * as Ot from "@ot-builder/font";

import { GlyphReferenceRectifier } from "../interface";

export class RectifyGeomGlyphAlg {
    constructor(private readonly rec: GlyphReferenceRectifier) {}
    public process(geom: null | Ot.Glyph.Geometry): null | Ot.Glyph.Geometry {
        if (!geom) return null;
        switch (geom.type) {
            case Ot.Glyph.GeometryType.ContourSet:
                return this.contourSet(geom);
            case Ot.Glyph.GeometryType.GeometryList:
                return this.geometryList(geom.items.map(item => this.process(item.ref)));
            case Ot.Glyph.GeometryType.TtReference:
                return this.ttReference(geom);
        }
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
        const to1 = this.rec.glyphRef(ref.to);
        if (!to1) return null;

        const ref1 = Ot.Glyph.TtReference.create(to1, ref.transform);
        ref1.roundXyToGrid = ref.roundXyToGrid;
        ref1.useMyMetrics = ref.useMyMetrics;
        ref1.overlapCompound = ref.overlapCompound;
        ref1.pointAttachment = ref.pointAttachment;
        return ref1;
    }
}
