import { alignBufferSize, Frag, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Thunk } from "@ot-builder/prelude";
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
        cfg: TtfCfg,
        designSpace: OtVar.DesignSpace,
        acEmpty?: ImpLib.Access<boolean>
    ) => {
        const ta = new TupleAllocator();
        const context: TupleVariationBuildContext = {
            designSpace: designSpace,
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
            for (let aid = 0; aid < designSpace.length; aid++) {
                bSharedTuples.push(F2D14, tuple[aid] || 0);
            }
        }

        // Entire table
        frag.uint16(1)
            .uint16(0)
            .uint16(designSpace.length)
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
        this.data = [
            ...(glyph.geometry ? new GeomVarCollector().process(glyph.geometry) : []),
            [glyph.horizontal.start, 0],
            [glyph.horizontal.end, 0],
            [0, glyph.vertical.start],
            [0, glyph.vertical.end]
        ];
    }
}

class GeomVarCollector {
    public process(geom: OtGlyph.Geometry): OtVar.Value[][] {
        switch (geom.type) {
            case OtGlyph.GeometryType.ContourSet:
                return this.contourSet(geom);
            case OtGlyph.GeometryType.TtReference:
                return this.ttReference(geom);
            case OtGlyph.GeometryType.GeometryList:
                return this.geometryList(geom);
        }
    }
    public contourSet(cs: OtGlyph.ContourSetProps) {
        const collected: OtVar.Value[][] = [];
        for (const c of cs.contours) {
            const items: OtVar.Value[] = [];
            for (const z of c) {
                items.push(z.x, z.y);
            }
            collected.push(items);
        }
        return collected;
    }
    public geometryList(geom: OtGlyph.GeometryListProps<{ ref: OtGlyph.Geometry }>) {
        const collected: OtVar.Value[][] = [];
        for (const entry of geom.items) {
            const sub = this.process(entry.ref);
            for (const x of sub) collected.push(x);
        }
        return collected;
    }
    public ttReference(ref: OtGlyph.TtReferenceProps) {
        return [[ref.transform.dx, ref.transform.dy]];
    }
}
