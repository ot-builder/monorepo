import { Frag, Write } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import {
    TupleAllocator,
    TupleVariationBuildContext,
    TupleVariationBuildSource,
    TupleVariationWriteOpt
} from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { TtfCfg } from "../cfg";

export const GvarTableWrite = Write(
    (
        frag,
        gOrd: OtGlyphOrder,
        cfg: Config<TtfCfg>,
        axes: Data.Order<OtVar.Axis>,
        acEmpty?: Data.Access<boolean>
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
                const tvdBuffer = Frag.pack(tvd);
                gvarOffsets.push(gvarBody.size);
                gvarBody.bytes(tvdBuffer);
                if (tvdBuffer.length % 2) gvarBody.uint8(0);
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

        if (gvarBody.size < 0x10000 * 2) {
            frag.uint16(0);
            frag.ptr32(gvarBody);
            for (let gid = 0; gid <= gOrd.length; gid++) {
                frag.uint16(gvarOffsets[gid] / 2);
            }
        } else {
            frag.uint16(1);
            frag.ptr32(gvarBody);
            for (let gid = 0; gid <= gOrd.length; gid++) {
                frag.uint32(gvarOffsets[gid]);
            }
        }
    }
);

class GlyphTupleVariationSource implements TupleVariationBuildSource {
    constructor(glyph: OtGlyph) {
        let cs: OtVar.Value[][] = [];
        for (const geometry of glyph.geometries) {
            if (geometry instanceof OtGlyph.ContourSet) {
                // Contours
                for (let cid = 0; cid < geometry.contours.length; cid++) {
                    const contour = geometry.contours[cid];
                    let cc: OtVar.Value[] = [];
                    cs.push(cc);
                    for (let zid = 0; zid < contour.length; zid++) {
                        cc.push(geometry.contours[cid][zid].x, geometry.contours[cid][zid].y);
                    }
                }
            } else if (geometry instanceof OtGlyph.TtReference) {
                // References
                cs.push([geometry.transform.dx, geometry.transform.dy]);
            }
        }
        // H metric
        cs.push([glyph.horizontal.start, 0], [glyph.horizontal.end, 0]);
        // V metric
        cs.push([0, glyph.vertical.start], [0, glyph.vertical.end]);
        this.data = cs;
    }
    public readonly dimensions = 2;
    public readonly data: OtVar.Value[][];
}
