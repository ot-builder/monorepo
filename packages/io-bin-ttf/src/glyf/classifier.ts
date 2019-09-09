import { Errors } from "@ot-builder/errors";
import { OtGeometryHandler, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

export class GlyphClassifier {
    constructor(private gOrd: Data.Order<OtGlyph>) {}
    public cache: Map<OtGlyph, SpaceGlyph> = new Map();

    private classifyImpl(g: OtGlyph): SpaceGlyph {
        const gid = this.gOrd.reverse(g);

        if (!g.geometries.length) {
            return new SpaceGlyph(gid, g.horizontal, g.vertical);
        }
        let hasReference = false;
        let allReference = true;
        let hasContours = false;
        let allContours = true;
        for (const geometry of g.geometries) {
            if (geometry instanceof OtGlyph.ContourSet) {
                hasContours = true;
            } else {
                allContours = false;
            }
            if (geometry instanceof OtGlyph.TtReference) {
                hasReference = true;
            } else {
                allReference = false;
            }
        }

        let instructions = Buffer.alloc(0);
        if (g.hints instanceof OtGlyph.TtfInstructionHint) instructions = g.hints.instructions;

        if (hasReference && allReference) {
            return new CompositeGlyph(
                this,
                gid,
                g.horizontal,
                g.vertical,
                g.geometries as OtGlyph.TtReference[],
                instructions
            );
        } else if (hasContours && allContours) {
            return new SimpleGlyph(
                gid,
                g.horizontal,
                g.vertical,
                g.geometries as OtGlyph.ContourSet[],
                instructions
            );
        } else {
            throw Errors.Ttf.MixedGlyph(gid);
        }
    }

    public classify(g: OtGlyph): SpaceGlyph {
        const cached = this.cache.get(g);
        if (cached) return cached;
        const sg = this.classifyImpl(g);
        this.cache.set(g, sg);
        return sg;
    }
}

export class SpaceGlyph {
    constructor(protected gid: number, public hm: OtGlyph.Metric, public vm: OtGlyph.Metric) {}
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
        const bound = OtGeometryHandler.stat(OtGeometryHandler.GetBound, ...this.outlines);
        const pointCount = OtGeometryHandler.stat(OtGeometryHandler.CountPoint, ...this.outlines);
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
            let stat = classifier.classify(ref.to).getStatData();
            if (stat.depth + 1 > depth) depth = stat.depth + 1;
            totalContours += stat.totalContours;
            totalPoints += stat.totalPoints;
        }

        const bound = OtGeometryHandler.stat(OtGeometryHandler.GetBound, ...references);
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
