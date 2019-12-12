import { alignBufferSize, Frag, Write } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Access, Data, Thunk } from "@ot-builder/prelude";
import { F2D14, UInt16 } from "@ot-builder/primitive";
import {
    TupleAllocator,
    TupleVariationBuildContext,
    TupleVariationBuildSource,
    TupleVariationWriteOpt
} from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { TtfCfg } from "../cfg";

import { GvarFlag, GvarOffsetAlign } from "./shared";

export const GvarTableWrite = Write(
    (
        frag,
        gOrd: Data.Order<OtGlyph>,
        cfg: Config<TtfCfg>,
        axes: Data.Order<OtVar.Axis>,
        acEmpty?: Access<boolean>
    ) => {
        const ta = new TupleAllocator();
        const context: TupleVariationBuildContext = {
            axes,
            tupleAllocator: ta,
            iupTolerance: cfg.ttf.gvarOptimizeTolerance
        };

        const gvarBody = new Frag();
        let hasMeaningfulData = false;
        const gvarOffsets = [];

        for (let gid = 0; gid < gOrd.length; gid++) {
            const tvd = TupleVariationWriteOpt.writeOpt(
                new GlyphTupleVariationSource(gOrd.at(gid)),
                context
            );
            if (tvd) {
                hasMeaningfulData = true;
                const tvdBuffer = alignBufferSize(Frag.pack(tvd), GvarOffsetAlign);
                gvarOffsets.push(gvarBody.size);
                gvarBody.bytes(tvdBuffer);
                gvarBody.uint32(0);
            } else {
                gvarOffsets.push(gvarBody.size);
            }
        }
        gvarOffsets.push(gvarBody.size);

        if (acEmpty) acEmpty.set(!hasMeaningfulData);

        const sharedTuples = [...ta.storage()];
        const bSharedTuples = new Frag();
        for (const tuple of sharedTuples) {
            for (let aid = 0; aid < axes.length; aid++) {
                bSharedTuples.push(F2D14, tuple[aid] || 0);
            }
        }

        // Entire table
        frag.uint16(1)
            .uint16(0)
            .uint16(axes.length)
            .uint16(sharedTuples.length)
            .ptr32(bSharedTuples)
            .uint16(gOrd.length);

        if (gvarBody.size < UInt16.max * 2) {
            frag.uint16(0);
            frag.ptr32(gvarBody);
            for (let gid = 0; gid <= gOrd.length; gid++) {
                frag.uint16(gvarOffsets[gid] / 2);
            }
        } else {
            frag.uint16(GvarFlag.LongOffsets);
            frag.ptr32(gvarBody);
            for (let gid = 0; gid <= gOrd.length; gid++) {
                frag.uint32(gvarOffsets[gid]);
            }
        }
    }
);

class GlyphTupleVariationSource implements TupleVariationBuildSource {
    public readonly dimensions = 2;
    public readonly data: OtVar.Value[][];

    constructor(glyph: OtGlyph) {
        this.data = glyph.acceptGlyphAlgebra(new VarCollector());
    }
}

class VarCollector implements OtGlyph.GlyphAlg<OtVar.Value[][]> {
    public geometryAlgebra = new GeomVarCollector();
    public hintAlgebra = null;
    public glyph(
        hMetric: OtGlyph.Metric,
        vMetric: OtGlyph.Metric,
        fnGeom: Data.Maybe<Thunk<OtVar.Value[][]>>,
        fnHints: Data.Maybe<Thunk<OtVar.Value[][]>>
    ) {
        const cs = [...(fnGeom ? fnGeom.force() : []), ...(fnHints ? fnHints.force() : [])];
        cs.push([hMetric.start, 0], [hMetric.end, 0]);
        cs.push([0, vMetric.start], [0, vMetric.end]);
        return cs;
    }
}

class GeomVarCollector implements OtGlyph.GeometryAlg<OtVar.Value[][]> {
    public empty() {
        return [];
    }
    public contourSet(cs: OtGlyph.ContourSetProps) {
        let collected: OtVar.Value[][] = [];
        for (const c of cs.contours) {
            const items: OtVar.Value[] = [];
            for (const z of c) {
                items.push(z.x, z.y);
            }
            collected.push(items);
        }
        return collected;
    }
    public geometryList(parts: OtVar.Value[][][]) {
        let collected: OtVar.Value[][] = [];
        for (const sub of parts) {
            for (const x of sub) collected.push(x);
        }
        return collected;
    }
    public ttReference(ref: OtGlyph.TtReferenceProps) {
        return [[ref.transform.dx, ref.transform.dy]];
    }
}
