import { BinaryView, Read } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
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
        const ms = new OtVar.MasterSet(undefined, true);
        this.contours = this.createContours(ms, glyph);
    }
    public readonly dimensions = 2;
    public readonly contours: TvdAccess<OtVar.Master>[][];

    private createContours(ms: OtVar.MasterSet, glyph: OtGlyph) {
        let cs: TvdAccess<OtVar.Master>[][] = [];
        for (const geometry of glyph.geometries) {
            if (geometry instanceof OtGlyph.ContourSet) {
                for (let cid = 0; cid < geometry.contours.length; cid++) {
                    const contour = geometry.contours[cid];
                    let cc: TvdAccess<OtVar.Master>[] = [];
                    cs.push(cc);
                    for (let zid = 0; zid < contour.length; zid++) {
                        cc.push(
                            new ContourTvdAccess(ms, geometry, cid, zid, 1),
                            new ContourTvdAccess(ms, geometry, cid, zid, 0)
                        );
                    }
                }
            } else if (geometry instanceof OtGlyph.TtReference) {
                cs.push([new RefTvdAccess(ms, geometry, 1), new RefTvdAccess(ms, geometry, 0)]);
            }
        }

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

class TvdIgnore implements TvdAccess<OtVar.Master> {
    public readonly original = 0;
    public addDelta(master: OtVar.Master, delta: number) {}
    public finish() {}
}
class ContourTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private readonly cs: OtGlyph.ContourSet,
        private readonly cid: number,
        private readonly zid: number,
        private readonly isX: number
    ) {
        super(ms);
        const z = cs.contours[cid][zid];
        this.original = isX ? OtVar.Ops.originOf(z.x) : OtVar.Ops.originOf(z.y);
    }
    public readonly original: number;
    public finish() {
        const z = this.cs.contours[this.cid][this.zid];
        const z1 = this.isX ? { ...z, x: this.collectTo(z.x) } : { ...z, y: this.collectTo(z.y) };
        this.cs.contours[this.cid][this.zid] = z1;
    }
}
class RefTvdAccess extends CumulativeTvd implements TvdAccess<OtVar.Master> {
    constructor(
        ms: OtVar.MasterSet,
        private ref: OtGlyph.TtReference,
        private readonly isX: number
    ) {
        super(ms);
        this.original = isX
            ? OtVar.Ops.originOf(ref.transform.dx)
            : OtVar.Ops.originOf(ref.transform.dy);
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
