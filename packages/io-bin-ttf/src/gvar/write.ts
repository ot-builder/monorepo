import { alignBufferSize, Frag, Write } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Access, Data } from "@ot-builder/prelude";
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
        let cs: OtVar.Value[][] = [];

        // Geometry
        glyph.acceptGeometryVisitor(new GeometryVisitor(cs));
        // H metric
        cs.push([glyph.horizontal.start, 0], [glyph.horizontal.end, 0]);
        // V metric
        cs.push([0, glyph.vertical.start], [0, glyph.vertical.end]);
        this.data = cs;
    }
}

// Inner classes
class GeometryVisitor implements OtGlyph.GeometryVisitor {
    constructor(public collected: OtVar.Value[][]) {}
    public begin() {}
    public end() {}
    public visitContourSet(g: OtGlyph.ContourSetGeometry) {
        g.acceptContourSetVisitor(new ContourSetVisitor(this.collected));
    }
    public visitReference(g: OtGlyph.ReferenceGeometry) {
        g.acceptReferenceVisitor(new RefVisitor(this.collected));
    }
}
class ContourSetVisitor implements OtGlyph.ContourSetVisitor {
    constructor(public collected: OtVar.Value[][]) {}
    public begin() {}
    public end() {}
    public visitContourSet(s: OtGlyph.ContourSetGeometry) {
        for (const c of s.listContours()) {
            c.acceptContourVisitor(new ContourVisitor(this.collected));
        }
    }
}
class ContourVisitor implements OtGlyph.ContourVisitor {
    constructor(public collected: OtVar.Value[][]) {}
    private readonly items: OtVar.Value[] = [];
    public begin() {}
    public end() {
        this.collected.push(this.items);
    }
    public visitContour(c: OtGlyph.ContourShape) {
        for (const z of c.listPoints()) {
            this.items.push(z.x, z.y);
        }
    }
}
class RefVisitor implements OtGlyph.ReferenceVisitor {
    constructor(public collected: OtVar.Value[][]) {}
    public begin() {}
    public end() {}
    public visitTarget() {}
    public visitTransform(pTransform: Access<OtGlyph.Transform2X3>) {
        const transform = pTransform.get();
        this.collected.push([transform.dx, transform.dy]);
    }
    public setPointAttachment() {}
    public setFlag() {}
}
