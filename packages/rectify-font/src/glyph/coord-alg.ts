import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export class RectifyGeomCoordAlg implements Ot.Glyph.GeometryAlg<null | Ot.Glyph.Geometry> {
    constructor(private readonly rec: Rectify.Coord.RectifierT<Ot.Var.Value>) {}
    public empty() {
        return null;
    }
    public contourSet(cs: Ot.Glyph.ContourSetProps) {
        const cs1: Ot.Glyph.Contour[] = [];
        for (const c of cs.contours) {
            const c1: Ot.Glyph.Contour = [];
            for (let zid = 0; zid < c.length; zid++) {
                const z = c[zid];
                c1[zid] = Ot.Glyph.Point.create(this.rec.coord(z.x), this.rec.coord(z.y), z.kind);
            }
            cs1.push(c1);
        }
        return Ot.Glyph.ContourSet.create(cs1);
    }
    public geometryList(children: (null | Ot.Glyph.Geometry)[]) {
        const meaningful: Ot.Glyph.Geometry[] = [];
        for (const item of children) if (item) meaningful.push(item);
        if (!meaningful.length) return null;
        return Ot.Glyph.GeometryList.create(meaningful);
    }
    public ttReference(ref: Ot.Glyph.TtReferenceProps) {
        const ref1 = Ot.Glyph.TtReference.create(ref.to, {
            ...ref.transform,
            dx: this.rec.coord(ref.transform.dx),
            dy: this.rec.coord(ref.transform.dy)
        });
        ref1.roundXyToGrid = ref.roundXyToGrid;
        ref1.useMyMetrics = ref.useMyMetrics;
        ref1.overlapCompound = ref.overlapCompound;
        ref1.pointAttachment = ref.pointAttachment;
        return ref1;
    }
}

export class RectifyHintCoordAlg implements Ot.Glyph.HintAlg<null | Ot.Glyph.Hint> {
    constructor(private readonly rec: Rectify.Coord.RectifierT<Ot.Var.Value>) {}

    public empty() {
        return null;
    }
    public ttInstructions(tt: Ot.Glyph.TtInstructionProps) {
        return Ot.Glyph.TtInstructionHint.create(tt.instructions);
    }
    public cffHint(ch: Ot.Glyph.CffHintProps) {
        const stemHMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        const stemVMap = new Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>();
        for (const s of ch.hStems) stemHMap.set(s, this.rectifyHintStem(s));
        for (const s of ch.vStems) stemVMap.set(s, this.rectifyHintStem(s));
        const h1 = Ot.Glyph.CffHint.create();
        h1.hStems = [...stemHMap.values()];
        h1.vStems = [...stemVMap.values()];
        h1.hintMasks = ch.hintMasks.map(m => this.rectifyMask(m, stemHMap, stemVMap));
        h1.counterMasks = ch.counterMasks.map(m => this.rectifyMask(m, stemHMap, stemVMap));
        return h1;
    }
    private rectifyHintStem(stem: Ot.Glyph.CffHintStem) {
        return Ot.Glyph.CffHint.createStem(this.rec.coord(stem.start), this.rec.coord(stem.end));
    }
    private rectifyMask(
        mask: Ot.Glyph.CffHintMask,
        stemHMap: Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>,
        stemVMap: Map<Ot.Glyph.CffHintStem, Ot.Glyph.CffHintStem>
    ) {
        const maskH: Set<Ot.Glyph.CffHintStem> = new Set();
        const maskV: Set<Ot.Glyph.CffHintStem> = new Set();
        for (const s of mask.maskH) {
            const s1 = stemHMap.get(s);
            if (s1) maskH.add(s1);
        }
        for (const s of mask.maskV) {
            const s1 = stemVMap.get(s);
            if (s1) maskV.add(s1);
        }
        return Ot.Glyph.CffHint.createMask(mask.at, maskH, maskV);
    }
}
