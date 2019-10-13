import { Errors } from "@ot-builder/errors";
import { OtGeometryHandler, OtGlyph } from "@ot-builder/ft-glyphs";
import { Caster, Data } from "@ot-builder/prelude";

export class GlyphClassifier {
    constructor(private gOrd: Data.Order<OtGlyph>) {}
    public cache: Map<OtGlyph, SpaceGlyph> = new Map();

    private classifyImpl(g: OtGlyph): SpaceGlyph {
        const gid = this.gOrd.reverse(g);

        const visitor = new GeometryClassifier();
        const hintVisitor = new HintClassifier();
        g.visitGeometry(visitor);
        g.visitHint(hintVisitor);

        if (!visitor.hasContours && !visitor.hasReference) {
            return new SpaceGlyph(gid, g.horizontal, g.vertical);
        }
        if (visitor.hasReference && visitor.allReference) {
            return new CompositeGlyph(
                this,
                gid,
                g.horizontal,
                g.vertical,
                visitor.collectedReferences,
                hintVisitor.collectedInstructions
            );
        }
        if (visitor.hasContours && visitor.allContours) {
            return new SimpleGlyph(
                gid,
                g.horizontal,
                g.vertical,
                visitor.collectedContourSets,
                hintVisitor.collectedInstructions
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

class GeometryClassifier implements OtGlyph.GeometryVisitor {
    public hasReference = false;
    public allReference = true;
    public hasContours = false;
    public allContours = true;

    public collectedContourSets: OtGlyph.ContourSet[] = [];
    public collectedReferences: OtGlyph.TtReference[] = [];

    public addContourSet() {
        return new ContourSetVisitor(this);
    }
    public addReference() {
        return new RefVisitor(this);
    }
}

class HintClassifier implements OtGlyph.TtfInstructionHintVisitor {
    public collectedInstructions: Buffer = Buffer.alloc(0);

    public queryInterface<T>(tag: Caster.TypeID<T>): undefined | T {
        return Caster.StandardQueryInterface(this, tag, OtGlyph.TID_TtfInstructionHintVisitor);
    }
    public begin() {}
    public end() {}
    public addInstructions(instr: Buffer) {
        this.collectedInstructions = instr;
    }
}

class ContourSetVisitor implements OtGlyph.ContourVisitor {
    constructor(private cls: GeometryClassifier) {}
    public collected = new OtGlyph.ContourSet();
    public begin() {}
    public addContour() {
        return new ContourVisitor(this.collected);
    }
    public end() {
        this.cls.hasContours = true;
        this.cls.allReference = false;
        this.cls.collectedContourSets.push(this.collected);
    }
}

class ContourVisitor implements OtGlyph.PrimitiveVisitor {
    constructor(private cs: OtGlyph.ContourSet) {}
    private collected: OtGlyph.Point[] = [];
    public begin() {}
    public end() {
        if (this.collected.length) this.cs.contours.push(this.collected);
    }
    public addControlKnot(k: OtGlyph.Point) {
        this.collected.push(k);
    }
}

class RefVisitor implements OtGlyph.ReferenceVisitor {
    constructor(private cls: GeometryClassifier) {}

    private to: null | OtGlyph = null;
    private transform: null | OtGlyph.Transform2X3 = null;
    public roundXyToGrid = false;
    public useMyMetrics = false;
    public overlapCompound = false;
    public pointAttachment: Data.Maybe<OtGlyph.PointAttachment> = null;

    public begin() {}
    public end() {
        if (!this.to || !this.transform) return;
        this.cls.hasReference = true;
        this.cls.allContours = false;

        const ref = new OtGlyph.TtReference(this.to, this.transform);
        ref.roundXyToGrid = this.roundXyToGrid;
        ref.useMyMetrics = this.useMyMetrics;
        ref.overlapCompound = this.overlapCompound;
        ref.pointAttachment = this.pointAttachment;
        this.cls.collectedReferences.push(ref);
    }
    public setTarget(g: OtGlyph) {
        this.to = g;
    }
    public setTransform(t: OtGlyph.Transform2X3) {
        this.transform = t;
    }
    public setPointAttachment(inner: number, outer: number) {
        this.pointAttachment = { inner: { pointIndex: inner }, outer: { pointIndex: outer } };
    }
    public setFlag(name: string, flag: boolean) {
        switch (name) {
            case "roundXyToGrid":
                this.roundXyToGrid = flag;
                break;
            case "useMyMetrics":
                this.useMyMetrics = flag;
                break;
            case "overlapCompound":
                this.overlapCompound = flag;
                break;
        }
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
