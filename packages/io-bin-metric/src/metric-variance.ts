import { Frag, Read, Write } from "@ot-builder/bin-util";
import * as ImpLib from "@ot-builder/common-impl";
import { Assert, Errors } from "@ot-builder/errors";
import { MetricVariance } from "@ot-builder/ot-glyphs";
import { Maxp } from "@ot-builder/ot-metadata";
import { Data } from "@ot-builder/prelude";
import { DeltaSetIndexMap, IndexMapping, ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

export const MetricVarianceIo = {
    ...Read((view, maxp: Maxp.Table, designSpace: OtVar.DesignSpace, isVertical: boolean) => {
        const mv = new MetricVariance.Table(isVertical);
        for (let gid = 0; gid < maxp.numGlyphs; gid++) {
            mv.measures[gid] = new MetricVariance.Measure();
        }

        const majorVersion = view.uint16();
        const minorVersion = view.uint16();
        Assert.SubVersionSupported("HMTX/VMTX", majorVersion, minorVersion, [1, 0]);

        const pIVS = view.ptr32();
        const ivs = pIVS.next(ReadTimeIVS, designSpace);

        // Mapping list
        const vAdvance = view.ptr32Nullable();
        if (vAdvance) {
            vAdvance.next(DeltaSetIndexMap, {
                nMappingsNeeded: mv.measures.length,
                addMapping(gid, outer, inner) {
                    mv.measures[gid].advance = ivs.queryValue(outer, inner);
                }
            });
        } else {
            for (let gid = 0; gid < mv.measures.length; gid++) {
                mv.measures[gid].advance = ivs.queryValue(0, gid);
            }
        }

        // Skip, we don't need them.
        const vStartSB = view.ptr32Nullable();
        const vEndSB = view.ptr32Nullable();

        // Read VORG if necessary
        const vVorg = mv.isVertical ? view.ptr32Nullable() : null;
        if (vVorg) {
            vVorg.next(DeltaSetIndexMap, {
                nMappingsNeeded: mv.measures.length,
                addMapping(gid, outer, inner) {
                    mv.measures[gid].start = ivs.queryValue(outer, inner);
                }
            });
        }

        return mv;
    }),
    ...Write(
        (
            frag,
            mv: MetricVariance.Table,
            designSpace: OtVar.DesignSpace,
            pEmpty?: Data.Maybe<ImpLib.Access<boolean>>
        ) => {
            // No axes present in font, reject
            if (!designSpace.length) throw Errors.Variation.NoAxes();
            Assert.NoGap("HVAR/VVAR measures", mv.measures);

            const ms = new OtVar.MasterSet();
            const ivs = WriteTimeIVS.create(ms);
            const mFallback = new OtVar.Master([
                {
                    dim: designSpace.at(0),
                    min: 0,
                    peak: 1,
                    max: 1
                }
            ]);

            let empty = true;
            const advanceMap: IndexMapping[] = [];
            const originMap: IndexMapping[] = [];
            for (let gid = 0; gid < mv.measures.length; gid++) {
                if (!OtVar.Ops.isConstant(mv.measures[gid].advance)) empty = false;
                advanceMap[gid] = ivs.valueToInnerOuterIDForce(
                    mv.measures[gid].advance,
                    mFallback
                );
            }
            if (mv.isVertical) {
                for (let gid = 0; gid < mv.measures.length; gid++) {
                    if (!OtVar.Ops.isConstant(mv.measures[gid].start)) empty = false;
                    originMap[gid] = ivs.valueToInnerOuterIDForce(
                        mv.measures[gid].start,
                        mFallback
                    );
                }
            }

            if (pEmpty) pEmpty.set(empty);

            frag.uint16(1).uint16(0); // Format
            frag.ptr32(Frag.from(WriteTimeIVS, ivs, { designSpace })); // itemVariationStoreOffset
            frag.ptr32(Frag.from(DeltaSetIndexMap, false, advanceMap)); // Advance mappings
            frag.ptr32(null); // LSB/RSB/TSB/BSB mappings are always set to empty
            frag.ptr32(null); // due to the limitation of OTVAR variation (no min/max functions)
            if (mv.isVertical) frag.ptr32(Frag.from(DeltaSetIndexMap, false, originMap)); // VORG mappings
        }
    )
};
