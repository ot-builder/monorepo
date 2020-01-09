import { BinaryView, Read } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Thunk } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import {
    TupleVariationGeometryClient,
    TupleVariationRead,
    TvdAccess
} from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { TtfCfg } from "../cfg";
import { CumulativeTvd } from "../shared/tvd-access";

import { GvarFlag } from "./shared";

export interface GvarReadIgnore {
    horizontalMetric?: boolean;
    verticalMetric?: boolean;
}

export const GvarTableRead = Read(
    (
        view,
        gOrd: Data.Order<OtGlyph>,
        cfg: TtfCfg,
        ignore: GvarReadIgnore,
        designSpace: OtVar.DesignSpace
    ) => {
        const header = view.next(GvarHeader, gOrd, cfg, designSpace);
        const ms = OtVar.Create.MasterSet();

        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            const dataOffset = header.glyphVariationDataOffsets[gid];
            const nextDataOffset = header.glyphVariationDataOffsets[gid + 1];
            if (dataOffset === nextDataOffset) continue;
            const ptr = header.glyphVariationDataArray.lift(dataOffset);
            ptr.next(TupleVariationRead, new GlyphTvhClient(ms, glyph, ignore), {
                designSpace,
                sharedTuples: header.sharedTuples
            });
        }
    }
);

const GvarHeader = Read(
    (bp: BinaryView, gOrd: Data.Order<OtGlyph>, cfg: TtfCfg, designSpace: OtVar.DesignSpace) => {
        const majorVersion = bp.uint16();
        const minorVersion = bp.uint16();
        const axisCount = bp.uint16();
        const sharedTupleCount = bp.uint16();
        const bpSharedTuples = bp.ptr32();
        const glyphCount = bp.uint16();
        const flags = bp.uint16();
        const glyphVariationDataArray = bp.ptr32();

        Assert.SubVersionSupported("GvarHeader", majorVersion, minorVersion, [1, 0]);
        Assert.SizeMatch("GvarHeader::axisCount", axisCount, designSpace.length);
        if (!cfg.ttf.gvarRead_permissiveGlyphCount) {
            Assert.SizeMatch("GvarHeader::glyphCount", glyphCount, gOrd.length);
        }

        const sharedTuples: number[][] = [];
        for (let tid = 0; tid < sharedTupleCount; tid++) {
            sharedTuples[tid] = bpSharedTuples.array(designSpace.length, F2D14);
        }

        const glyphVariationDataOffsets: number[] = [];
        if (flags & GvarFlag.LongOffsets) {
            for (let gid = 0; gid <= glyphCount; gid++) {
                glyphVariationDataOffsets[gid] = bp.uint32();
            }
        } else {
            for (let gid = 0; gid <= glyphCount; gid++) {
                glyphVariationDataOffsets[gid] = bp.uint16() * 2;
            }
        }
        return { sharedTuples, glyphVariationDataArray, glyphVariationDataOffsets };
    }
);

class GlyphTvhClient implements TupleVariationGeometryClient {
    constructor(ms: OtVar.MasterSet, private glyph: OtGlyph, ignore: GvarReadIgnore) {
        this.glyphHolder = glyph.apply(new VarPtrCollector());
        this.contours = this.glyphHolder.tvdAccesses(ms, ignore);
    }
    public readonly dimensions = 2;
    public readonly contours: TvdAccess<OtVar.Master>[][];
    public readonly glyphHolder: GlyphHolder;

    public finish() {
        for (const c of this.contours) for (const z of c) z.finish();
        this.glyphHolder.apply(this.glyph);
    }
}

class VarPtrCollector implements OtGlyph.GlyphAlg<GlyphHolder, GeomHolder, void> {
    public geometryAlgebra = new GeomVarPtrCollector();
    public hintAlgebra = null;
    public glyph(
        hMetric: OtGlyph.Metric,
        vMetric: OtGlyph.Metric,
        fnGeom: Data.Maybe<Thunk<GeomHolder>>,
        fnHints: Data.Maybe<Thunk<void>>
    ) {
        const gh = new GlyphHolder();
        if (fnGeom) gh.geometry = fnGeom.force();
        gh.hMetric = new HMetricHolder(hMetric);
        gh.vMetric = new VMetricHolder(vMetric);
        return gh;
    }
}

class GeomVarPtrCollector implements OtGlyph.GeometryAlg<GeomHolder> {
    public contourSet(cs: OtGlyph.ContourSetProps) {
        return new ContourHolder(cs);
    }
    public geometryList(parts: GeomHolder[]) {
        return new GeometryListHolder(parts);
    }
    public ttReference(ref: OtGlyph.TtReferenceProps) {
        return new TtReferenceHolder(ref);
    }
}

// Holder classes
class GlyphHolder {
    public geometry?: GeomHolder;
    public hMetric?: MetricHolder;
    public vMetric?: MetricHolder;

    public apply(g: OtGlyph) {
        if (this.geometry) g.geometry = this.geometry.toGeometry();
        if (this.hMetric) g.horizontal = this.hMetric.metric;
        if (this.vMetric) g.vertical = this.vMetric.metric;
    }

    public tvdAccesses(ms: OtVar.MasterSet, ignore: GvarReadIgnore): TvdAccess<OtVar.Master>[][] {
        const sink: TvdAccess<OtVar.Master>[][] = [];
        if (this.geometry) this.geometry.collectTvdAccesses(sink, ms, ignore);
        if (this.hMetric) this.hMetric.collectTvdAccesses(sink, ms, ignore);
        if (this.vMetric) this.vMetric.collectTvdAccesses(sink, ms, ignore);
        return sink;
    }
}

interface GeomHolder {
    collectTvdAccesses(
        sink: TvdAccess<OtVar.Master>[][],
        ms: OtVar.MasterSet,
        ignore: GvarReadIgnore
    ): void;
    toGeometry(): OtGlyph.Geometry;
}

class ContourHolder implements GeomHolder {
    private readonly contours: OtGlyph.Contour[];
    constructor(cs: OtGlyph.ContourSetProps) {
        this.contours = cs.contours.map(c => [...c]);
    }
    public toGeometry() {
        return OtGlyph.ContourSet.create(this.contours);
    }
    public collectTvdAccesses(sink: TvdAccess<OtVar.Master>[][], ms: OtVar.MasterSet) {
        for (let cid = 0; cid < this.contours.length; cid++) {
            const items: TvdAccess<OtVar.Master>[] = [];
            for (let zid = 0; zid < this.contours[cid].length; zid++) {
                items.push(
                    new ContourTvdAccess(ms, this.contours, cid, zid, 1),
                    new ContourTvdAccess(ms, this.contours, cid, zid, 0)
                );
            }
            sink.push(items);
        }
    }
}

class TtReferenceHolder implements GeomHolder {
    private readonly ref: OtGlyph.TtReferenceProps;
    constructor(ref: OtGlyph.TtReferenceProps) {
        this.ref = { ...ref };
    }
    public toGeometry() {
        const ref1 = OtGlyph.TtReference.create(this.ref.to, this.ref.transform);
        ref1.roundXyToGrid = this.ref.roundXyToGrid;
        ref1.useMyMetrics = this.ref.useMyMetrics;
        ref1.overlapCompound = this.ref.overlapCompound;
        ref1.pointAttachment = this.ref.pointAttachment;
        return ref1;
    }
    public collectTvdAccesses(sink: TvdAccess<OtVar.Master>[][], ms: OtVar.MasterSet) {
        sink.push([new RefTvdAccess(ms, this.ref, 1), new RefTvdAccess(ms, this.ref, 0)]);
    }
}

class GeometryListHolder implements GeomHolder {
    constructor(private readonly children: GeomHolder[]) {}
    public toGeometry() {
        return OtGlyph.GeometryList.create(this.children.map(c => c.toGeometry()));
    }
    public collectTvdAccesses(
        sink: TvdAccess<OtVar.Master>[][],
        ms: OtVar.MasterSet,
        ignore: GvarReadIgnore
    ) {
        for (const sub of this.children) {
            sub.collectTvdAccesses(sink, ms, ignore);
        }
    }
}

interface MetricHolder {
    metric: OtGlyph.Metric;
    collectTvdAccesses(
        sink: TvdAccess<OtVar.Master>[][],
        ms: OtVar.MasterSet,
        ignore: GvarReadIgnore
    ): void;
}

class HMetricHolder implements MetricHolder {
    constructor(public metric: OtGlyph.Metric) {}
    public collectTvdAccesses(
        sink: TvdAccess<OtVar.Master>[][],
        ms: OtVar.MasterSet,
        ignore: GvarReadIgnore
    ) {
        // H metric
        if (ignore.horizontalMetric) {
            sink.push([new TvdIgnore(), new TvdIgnore()], [new TvdIgnore(), new TvdIgnore()]);
        } else {
            sink.push(
                [new MetricTvdAccess(ms, this, 1), new TvdIgnore()],
                [new MetricTvdAccess(ms, this, 0), new TvdIgnore()]
            );
        }
    }
}
class VMetricHolder implements MetricHolder {
    constructor(public metric: OtGlyph.Metric) {}
    public collectTvdAccesses(
        sink: TvdAccess<OtVar.Master>[][],
        ms: OtVar.MasterSet,
        ignore: GvarReadIgnore
    ) {
        // V metric
        if (ignore.verticalMetric) {
            sink.push([new TvdIgnore(), new TvdIgnore()], [new TvdIgnore(), new TvdIgnore()]);
        } else {
            sink.push(
                [new TvdIgnore(), new MetricTvdAccess(ms, this, 1)],
                [new TvdIgnore(), new MetricTvdAccess(ms, this, 0)]
            );
        }
    }
}

// TvdAccess implementations
class TvdIgnore implements TvdAccess<OtVar.Master> {
    public readonly original = 0;
    public addDelta(master: OtVar.Master, delta: number) {}
    public finish() {}
}
class ContourTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private readonly cs: OtGlyph.Contour[],
        private readonly cid: number,
        private readonly zid: number,
        private readonly isX: number
    ) {
        super(ms);
        const z = cs[cid][zid];
        this.original = isX ? OtVar.Ops.originOf(z.x) : OtVar.Ops.originOf(z.y);
    }
    public readonly original: number;
    public finish() {
        const z = this.cs[this.cid][this.zid];
        const z1 = this.isX ? { ...z, x: this.collectTo(z.x) } : { ...z, y: this.collectTo(z.y) };
        this.cs[this.cid][this.zid] = z1;
    }
}
class RefTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private ref: OtGlyph.TtReferenceProps,
        private readonly isX: number
    ) {
        super(ms);
        const transform = ref.transform;
        this.original = isX ? OtVar.Ops.originOf(transform.dx) : OtVar.Ops.originOf(transform.dy);
    }
    public readonly original: number;
    public finish() {
        const tf = this.ref.transform;
        const tf1 = {
            ...tf,
            ...(this.isX ? { dx: this.collectTo(tf.dx) } : { dy: this.collectTo(tf.dy) })
        };
        this.ref.transform = tf1;
    }
}
class MetricTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private pMetric: MetricHolder,
        private readonly isStart: number
    ) {
        super(ms);
        const met = pMetric.metric;
        this.original = isStart ? OtVar.Ops.originOf(met.start) : OtVar.Ops.originOf(met.end);
    }
    public readonly original: number;
    public finish() {
        const met = this.pMetric.metric;
        this.pMetric.metric = {
            ...met,
            ...(this.isStart
                ? { start: this.collectTo(met.start) }
                : { end: this.collectTo(met.end) })
        };
    }
}
