import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Gsub } from "@ot-builder/ot-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableSizeLimit,
    SubtableWriteContext,
    SubtableWriteTrick
} from "../gsub-gpos-shared/general";
import { CovUtils, GidCoverage, MaxCovItemWords, Ptr16GidCoverage } from "../shared/coverage";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gsub.Single, context: SubtableReadingContext<Gsub.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`SingleSubstFormat1`, format, 1);
        const coverage = view.ptr16().next(GidCoverage);
        const deltaGlyphId = view.int16();
        for (const gid of coverage) {
            const gSource = context.gOrd.at(gid);
            if (lookup.mapping.has(gSource)) continue;
            lookup.mapping.set(gSource, context.gOrd.at((gid + deltaGlyphId + 0x20000) % 0x10000));
        }
    },
    write(
        frag: Frag,
        gidDiff: number,
        data: [number, number][],
        ctx: SubtableWriteContext<Gsub.Lookup>
    ) {
        frag.uint16(1);
        frag.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(data), ctx.trick);
        frag.uint16(gidDiff);
    }
};

const SubtableFormat2 = {
    read(view: BinaryView, lookup: Gsub.Single, context: SubtableReadingContext<Gsub.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`SingleSubstFormat2`, format, 2);

        const coverage = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch(`SingleSubstFormat2::glyphCount`, glyphCount, coverage.length);

        for (const gid of coverage) {
            const substituteGlyphID = view.uint16();
            const gSource = context.gOrd.at(gid);
            if (lookup.mapping.has(gSource)) continue;
            lookup.mapping.set(gSource, context.gOrd.at(substituteGlyphID));
        }
    },
    write(frag: Frag, data: [number, number][], ctx: SubtableWriteContext<Gsub.Lookup>) {
        frag.uint16(2);
        frag.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(data), ctx.trick);
        frag.uint16(data.length);
        frag.array(UInt16, CovUtils.valueListFromAuxMap(data));
    }
};

export class GsubSingleReader implements LookupReader<Gsub.Lookup, Gsub.Single> {
    public createLookup() {
        return new Gsub.Single();
    }

    public parseSubtable(
        view: BinaryView,
        lookup: Gsub.Single,
        context: SubtableReadingContext<Gsub.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, context);
                break;
            case 2:
                view.next(SubtableFormat2, lookup, context);
                break;
            default:
                throw Errors.FormatNotSupported(`Single Substitution Subtable`, format);
        }
    }
}

class GsubSingleWriterState {
    public mappings: Map<number, [number, number][]> = new Map();
    public addGidDiff(from: number, to: number) {
        const diff = (to - from + 0x20000) % 0x10000;
        let arr = this.mappings.get(diff);
        if (!arr) {
            arr = [];
            this.mappings.set(diff, arr);
        }
        arr.push([from, to]);
    }
    public collectJagged(singleLookup: boolean) {
        const out: [number, number][] = [];
        for (const [diff, pairs] of this.mappings) {
            if (singleLookup || pairs.length < 8) {
                this.mappings.delete(diff);
                for (const p of pairs) out.push(p);
            }
        }
        return out;
    }
}

const MaxJaggedItems = Math.floor(
    (SubtableSizeLimit - UInt16.size * 16) / ((MaxCovItemWords + 1) * UInt16.size)
);
const MaxUniformItems = Math.floor(
    (SubtableSizeLimit - UInt16.size * 16) / (MaxCovItemWords * UInt16.size)
);

export class GsubSingleWriter implements LookupWriter<Gsub.Lookup, Gsub.Single> {
    public canBeUsed(l: Gsub.Lookup): l is Gsub.Single {
        return l.type === Gsub.LookupType.Single;
    }
    public getLookupType() {
        return 1;
    }
    public getLookupTypeSymbol() {
        return Gsub.LookupType.Single;
    }
    private buildJagged(
        frags: Frag[],
        jagged: [number, number][],
        ctx: SubtableWriteContext<Gsub.Lookup>
    ) {
        const data = CovUtils.sortAuxMap([...jagged].slice(0, MaxJaggedItems));
        frags.push(Frag.from(SubtableFormat2, data, ctx));
        return data.length;
    }

    private buildUniform(
        frags: Frag[],
        gidDiff: number,
        mappings: [number, number][],
        ctx: SubtableWriteContext<Gsub.Lookup>
    ) {
        const data = CovUtils.sortAuxMap([...mappings].slice(0, MaxUniformItems));
        frags.push(Frag.from(SubtableFormat1, gidDiff, data, ctx));
        return data.length;
    }

    public createSubtableFragments(lookup: Gsub.Single, ctx: SubtableWriteContext<Gsub.Lookup>) {
        const singleLookup = !!(ctx.trick & SubtableWriteTrick.AvoidBreakSubtable);
        const st = new GsubSingleWriterState();
        for (const [from, to] of lookup.mapping) {
            st.addGidDiff(ctx.gOrd.reverse(from), ctx.gOrd.reverse(to));
        }
        const frags: Frag[] = [];

        // jagged
        const jagged = st.collectJagged(singleLookup);
        while (jagged.length) {
            const len = this.buildJagged(frags, jagged, ctx);
            jagged.splice(0, len);
        }

        // flat
        for (const [gidDiff, mappings] of st.mappings) {
            if (mappings && mappings.length) {
                while (mappings.length) {
                    const len = this.buildUniform(frags, gidDiff, mappings, ctx);
                    mappings.splice(0, len);
                }
            }
        }

        return frags;
    }
}
