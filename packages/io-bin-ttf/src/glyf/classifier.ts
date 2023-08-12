import { Errors } from "@ot-builder/errors";
import { OtGeometryUtil, OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

export class GlyphClassifier {
    constructor(private gOrd: Data.Order<OtGlyph>) {}
    public cache: WeakMap<OtGlyph, SpaceGlyph> = new Map();

    private classifyImpl(g: OtGlyph): SpaceGlyph {
        const gid = this.gOrd.reverse(g);

        const algGeom = new GeometryClassifier();
        const algHint = new HintClassifier();
        if (g.geometry) algGeom.process(g.geometry);
        if (g.hints) algHint.process(g.hints);

        if (!algGeom.hasContours && !algGeom.hasReference) {
            return new SpaceGlyph(gid, g.horizontal, g.vertical);
        }
        if (algGeom.hasReference && algGeom.allReference) {
            return new CompositeGlyph(
                this,
                gid,
                g.horizontal,
                g.vertical,
                algGeom.collectedReferences,
                algHint.collectedInstructions
            );
        }
        if (algGeom.hasContours && algGeom.allContours) {
            return new SimpleGlyph(
                gid,
                g.horizontal,
                g.vertical,
                algGeom.collectedContourSets,
                algHint.collectedInstructions
            );
        }
        throw Errors.Ttf.MixedGlyph(gid);
    }

    public classify(g: OtGlyph): SpaceGlyph {
        const cached = this.cache.get(g);
        if (cached) return cached;
        const sg = this.classifyImpl(g);
        this.cache.set(g, sg);
        return sg;
    }
}

class GeometryClassifier {
    public hasReference = false;
    public allReference = true;
    public hasContours = false;
    public allContours = true;

    public collectedContourSets: OtGlyph.ContourSet[] = [];
    public collectedReferences: OtGlyph.TtReference[] = [];

    public process(g: OtGlyph.Geometry) {
        switch (g.type) {
            case OtGlyph.GeometryType.ContourSet:
                return this.contourSet(g);
            case OtGlyph.GeometryType.TtReference:
                return this.ttReference(g);
            case OtGlyph.GeometryType.GeometryList:
                return this.geometryList(g);
        }
    }

    public contourSet(csProps: OtGlyph.ContourSetProps) {
        this.hasContours = true;
        this.allReference = false;
        this.collectedContourSets.push(new OtGlyph.ContourSet(csProps.contours));
    }
    public geometryList(glProps: OtGlyph.GeometryListProps) {
        for (const entry of glProps.items) this.process(entry);
    }
    public ttReference(refProps: OtGlyph.TtReferenceProps) {
        this.hasReference = true;
        this.allContours = false;
        const ref = new OtGlyph.TtReference(refProps.to, refProps.transform);
        ref.roundXyToGrid = refProps.roundXyToGrid;
        ref.useMyMetrics = refProps.useMyMetrics;
        ref.pointAttachment = refProps.pointAttachment;
        this.collectedReferences.push(ref);
    }
}

class HintClassifier {
    public collectedInstructions: Buffer = Buffer.alloc(0);

    public process(h: OtGlyph.Hint) {
        switch (h.type) {
            case OtGlyph.HintType.TtInstruction:
                this.collectedInstructions = h.instructions;
        }
    }
}

export class SpaceGlyph {
    constructor(
        protected gid: number,
        public hm: OtGlyph.Metric,
        public vm: OtGlyph.Metric
    ) {}
    public getStatData(): OtGlyph.Stat.ComplexGlyphStat {
        return {
            eigenContours: 0,
            eigenPoints: 0,
            extent: { xMin: 0, xMax: 0, yMin: 0, yMax: 0 },
            depth: 0,
            eigenReferences: 0,
            totalContours: 0,
            totalPoints: 0
        };
    }
    public stat(sink: OtGlyph.Stat.Sink) {
        sink.simpleGlyphStat(this.getStatData());
        sink.instructionsStat(0);
        sink.setMetric(this.gid, this.hm, this.vm, { xMin: 0, xMax: 0, yMin: 0, yMax: 0 });
    }
}

export class SimpleGlyph extends SpaceGlyph {
    constructor(
        gid: number,
        hm: OtGlyph.Metric,
        vm: OtGlyph.Metric,
        public outlines: OtGlyph.ContourSet[],
        public instructions: Buffer
    ) {
        super(gid, hm, vm);
        const bound = OtGeometryUtil.apply(OtGeometryUtil.GetBound, ...this.outlines);
        const pointCount = OtGeometryUtil.apply(OtGeometryUtil.CountPoint, ...this.outlines);
        let contourCount = 0;
        for (const cs of outlines) contourCount += cs.contours.length;
        this.st = {
            eigenContours: contourCount,
            eigenPoints: pointCount,
            extent: bound,
            depth: 0,
            eigenReferences: 0,
            totalContours: contourCount,
            totalPoints: pointCount
        };
    }

    private st: OtGlyph.Stat.ComplexGlyphStat;

    public getStatData(): OtGlyph.Stat.ComplexGlyphStat {
        return this.st;
    }

    public stat(sink: OtGlyph.Stat.Sink) {
        sink.simpleGlyphStat(this.getStatData());
        sink.instructionsStat(this.instructions.byteLength);
        sink.setMetric(this.gid, this.hm, this.vm, this.st.extent);
    }
}

export class CompositeGlyph extends SpaceGlyph {
    constructor(
        classifier: GlyphClassifier,
        gid: number,
        hm: OtGlyph.Metric,
        vm: OtGlyph.Metric,
        public references: OtGlyph.TtReference[],
        public instructions: Buffer
    ) {
        super(gid, hm, vm);

        let totalContours = 0;
        let totalPoints = 0;
        let depth = 1;
        for (const ref of references) {
            const stat = classifier.classify(ref.to).getStatData();
            if (stat.depth + 1 > depth) depth = stat.depth + 1;
            totalContours += stat.totalContours;
            totalPoints += stat.totalPoints;
        }

        const bound = OtGeometryUtil.apply(OtGeometryUtil.GetBound, ...references);
        this.st = {
            eigenContours: 0,
            eigenPoints: 0,
            extent: bound,
            depth,
            eigenReferences: references.length,
            totalContours,
            totalPoints
        };
    }

    private st: OtGlyph.Stat.ComplexGlyphStat;
    public getStatData(): OtGlyph.Stat.ComplexGlyphStat {
        return this.st;
    }

    public stat(sink: OtGlyph.Stat.Sink) {
        sink.complexGlyphStat(this.getStatData());
        sink.instructionsStat(this.instructions.byteLength);
        sink.setMetric(this.gid, this.hm, this.vm, this.st.extent);
    }
}
