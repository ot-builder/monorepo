import { BinaryView, Read } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import { TupleVariationGeometryClient, TupleVariationRead, TvdAccess } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { TtfCfg } from "../cfg";
import { CumulativeTvd } from "../shared/tvd-access";

export interface GvarReadIgnore {
    horizontalMetric?: boolean;
    verticalMetric?: boolean;
}

export const GvarTableRead = Read(
    (
        view,
        gOrd: Data.Order<OtGlyph>,
        cfg: Config<TtfCfg>,
        ignore: GvarReadIgnore,
        axes: Data.Order<OtVar.Axis>
    ) => {
        const header = view.next(GvarHeader, gOrd, cfg, axes);

        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            const dataOffset = header.glyphVariationDataOffsets[gid];
            const nextDataOffset = header.glyphVariationDataOffsets[gid + 1];
            if (dataOffset === nextDataOffset) continue;
            const ptr = header.glyphVariationDataArray.lift(dataOffset);
            ptr.next(TupleVariationRead, new GlyphTvhClient(glyph, ignore), {
                axes,
                sharedTuples: header.sharedTuples
            });
        }
    }
);

const GvarHeader = Read(
    (
        bp: BinaryView,
        gOrd: Data.Order<OtGlyph>,
        cfg: Config<TtfCfg>,
        axes: Data.Order<OtVar.Axis>
    ) => {
        const majorVersion = bp.uint16();
        const minorVersion = bp.uint16();
        const axisCount = bp.uint16();
        const sharedTupleCount = bp.uint16();
        const bpSharedTuples = bp.ptr32();
        const glyphCount = bp.uint16();
        const flags = bp.uint16();
        const glyphVariationDataArray = bp.ptr32();

        Assert.SubVersionSupported("GvarHeader", majorVersion, minorVersion, [1, 0]);
        Assert.SizeMatch("GvarHeader::axisCount", axisCount, axes.length);
        if (!cfg.ttf.gvarRead_permissiveGlyphCount) {
            Assert.SizeMatch("GvarHeader::glyphCount", glyphCount, gOrd.length);
        }

        const sharedTuples: number[][] = [];
        for (let tid = 0; tid < sharedTupleCount; tid++) {
            sharedTuples[tid] = bpSharedTuples.array(axes.length, F2D14);
        }

        const glyphVariationDataOffsets: number[] = [];
        if (flags & 1) {
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
    constructor(glyph: OtGlyph, private readonly ignore: GvarReadIgnore) {
        const ms = new OtVar.MasterSet();
        this.contours = this.createContours(ms, glyph);
    }
    public readonly dimensions = 2;
    public readonly contours: TvdAccess<OtVar.Master>[][];

    private createContours(ms: OtVar.MasterSet, glyph: OtGlyph) {
        let cs: TvdAccess<OtVar.Master>[][] = [];

        glyph.visitGeometry(new GeometryVisitor(ms, cs));

        // H metric
        if (this.ignore.horizontalMetric) {
            cs.push([new TvdIgnore(), new TvdIgnore()], [new TvdIgnore(), new TvdIgnore()]);
        } else {
            cs.push(
                [new MetricTvdAccess(ms, glyph, 1, 1), new TvdIgnore()],
                [new MetricTvdAccess(ms, glyph, 1, 0), new TvdIgnore()]
            );
        }

        // V metric
        if (this.ignore.verticalMetric) {
            cs.push([new TvdIgnore(), new TvdIgnore()], [new TvdIgnore(), new TvdIgnore()]);
        } else {
            cs.push(
                [new TvdIgnore(), new MetricTvdAccess(ms, glyph, 0, 1)],
                [new TvdIgnore(), new MetricTvdAccess(ms, glyph, 0, 0)]
            );
        }
        return cs;
    }

    public finish() {
        for (const c of this.contours) for (const z of c) z.finish();
    }
}

// Inner classes
class GeometryVisitor implements OtGlyph.GeometryVisitor {
    constructor(
        private readonly ms: OtVar.MasterSet,
        public collected: TvdAccess<OtVar.Master>[][]
    ) {}
    public visitContourSet() {
        return new ContourSetVisitor(this.ms, this.collected);
    }
    public visitReference() {
        return new RefVisitor(this.ms, this.collected);
    }
}
class ContourSetVisitor implements OtGlyph.ContourVisitor {
    constructor(
        private readonly ms: OtVar.MasterSet,
        public collected: TvdAccess<OtVar.Master>[][]
    ) {}
    public begin() {}
    public end() {}
    public visitContour() {
        return new ContourVisitor(this.ms, this.collected);
    }
}
class ContourVisitor implements OtGlyph.PrimitiveVisitor {
    constructor(
        private readonly ms: OtVar.MasterSet,
        public collected: TvdAccess<OtVar.Master>[][]
    ) {}
    private readonly items: TvdAccess<OtVar.Master>[] = [];
    public begin() {}
    public end() {
        this.collected.push(this.items);
    }
    public visitPoint(pZ: ImpLib.Access<OtGlyph.Point>) {
        this.items.push(new ContourTvdAccess(this.ms, pZ, 1), new ContourTvdAccess(this.ms, pZ, 0));
    }
}
class RefVisitor implements OtGlyph.ReferenceVisitor {
    constructor(
        private readonly ms: OtVar.MasterSet,
        public collected: TvdAccess<OtVar.Master>[][]
    ) {}
    public begin() {}
    public end() {}
    public visitTarget() {}
    public visitTransform(pTransform: ImpLib.Access<OtGlyph.Transform2X3>) {
        this.collected.push([
            new RefTvdAccess(this.ms, pTransform, 1),
            new RefTvdAccess(this.ms, pTransform, 0)
        ]);
    }
    public setPointAttachment() {}
    public setFlag() {}
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
        private readonly pZ: ImpLib.Access<OtGlyph.Point>,
        private readonly isX: number
    ) {
        super(ms);
        const z = pZ.get();
        this.original = isX ? OtVar.Ops.originOf(z.x) : OtVar.Ops.originOf(z.y);
    }
    public readonly original: number;
    public finish() {
        const z = this.pZ.get();
        const z1 = this.isX ? { ...z, x: this.collectTo(z.x) } : { ...z, y: this.collectTo(z.y) };
        this.pZ.set(z1);
    }
}
class RefTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private pTransform: ImpLib.Access<OtGlyph.Transform2X3>,
        private readonly isX: number
    ) {
        super(ms);
        const transform = pTransform.get();
        this.original = isX ? OtVar.Ops.originOf(transform.dx) : OtVar.Ops.originOf(transform.dy);
    }
    public readonly original: number;
    public finish() {
        const tf = this.pTransform.get();
        const tf1 = {
            ...tf,
            ...(this.isX ? { dx: this.collectTo(tf.dx) } : { dy: this.collectTo(tf.dy) })
        };
        this.pTransform.set(tf1);
    }
}
class MetricTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private ref: OtGlyph,
        private readonly isH: number,
        private readonly isStart: number
    ) {
        super(ms);
        const met = isH ? ref.horizontal : ref.vertical;
        this.original = isStart ? OtVar.Ops.originOf(met.start) : OtVar.Ops.originOf(met.end);
    }
    public readonly original: number;
    public finish() {
        const met = this.isH ? this.ref.horizontal : this.ref.vertical;
        const met1 = {
            ...met,
            ...(this.isStart
                ? { start: this.collectTo(met.start) }
                : { end: this.collectTo(met.end) })
        };
        if (this.isH) this.ref.horizontal = met1;
        else this.ref.vertical = met1;
    }
}
