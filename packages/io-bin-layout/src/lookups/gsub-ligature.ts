import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gsub } from "@ot-builder/ft-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableSizeLimit,
    SubtableWriteContext
} from "../gsub-gpos-shared/general";
import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";

import { LookupIsGsubLigatureAlg } from "./lookup-type-alg";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gsub.Ligature, context: SubtableReadingContext<Gsub.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`LigatureSubstFormat1`, format, 1);

        const coverage = view.next(Ptr16GidCoverage);
        const ligatureSetCount = view.uint16();
        Assert.SizeMatch(
            `LigatureSubstFormat1::ligatureSetCount`,
            coverage.length,
            ligatureSetCount
        );

        for (const gidFirst of coverage) {
            const ligatureSet = view.ptr16();
            const ligatureCount = ligatureSet.uint16();
            for (let lsid = 0; lsid < ligatureCount; lsid++) {
                const ligature = ligatureSet.ptr16();
                const gidLigatureGlyph = ligature.uint16();
                const componentCount = ligature.uint16();
                const componentGlyphIDs = ligature.array(componentCount - 1, UInt16);
                lookup.mapping.push({
                    from: [gidFirst, ...componentGlyphIDs].map(gid => context.gOrd.at(gid)),
                    to: context.gOrd.at(gidLigatureGlyph)
                });
            }
        }
    },
    write(
        frag: Frag,
        mapping: Map<OtGlyph, LigatureCont[]>,
        ctx: SubtableWriteContext<Gsub.Lookup>
    ) {
        const { gidList, values } = CovUtils.splitListFromMap(mapping, ctx.gOrd);

        frag.uint16(1);
        frag.push(Ptr16GidCoverage, gidList);
        frag.uint16(values.length);
        for (let ligSet of values) {
            const fLigSet = frag.ptr16New();
            fLigSet.uint16(ligSet.length);
            for (const [rests, to] of ligSet) {
                const fLig = fLigSet.ptr16New();
                fLig.uint16(ctx.gOrd.reverse(to))
                    .uint16(rests.length + 1)
                    .array(
                        UInt16,
                        rests.map(g => ctx.gOrd.reverse(g))
                    );
            }
        }
    }
};

export class GsubLigatureReader implements LookupReader<Gsub.Lookup, Gsub.Ligature> {
    public createLookup() {
        return Gsub.Ligature.create();
    }

    public parseSubtable(
        view: BinaryView,
        lookup: Gsub.Ligature,
        context: SubtableReadingContext<Gsub.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, context);
                break;
            default:
                throw Errors.FormatNotSupported(`Ligature Substitution Subtable`, format);
        }
    }
}

type LigatureCont = [OtGlyph[], OtGlyph];
class State {
    public mapping: Map<OtGlyph, LigatureCont[]> = new Map();
    public size = UInt16.size * 4;

    public tryAddMapping(from: OtGlyph, [components, to]: LigatureCont) {
        const deltaSize = UInt16.size * (3 + components.length);
        if (this.size + deltaSize > SubtableSizeLimit) return false;

        let arr = this.mapping.get(from);
        if (!arr) {
            arr = [];
            this.mapping.set(from, arr);
        }
        arr.push([components, to]);
        this.size += deltaSize;
        return true;
    }
}

export class GsubLigatureWriter implements LookupWriter<Gsub.Lookup, Gsub.Ligature> {
    public canBeUsed(l: Gsub.Lookup): l is Gsub.Ligature {
        return l.apply(LookupIsGsubLigatureAlg);
    }
    public getLookupType() {
        return 4;
    }
    public flush(frags: Frag[], state: State, ctx: SubtableWriteContext<Gsub.Lookup>) {
        if (!state.mapping.size) return;
        frags.push(Frag.from(SubtableFormat1, state.mapping, ctx));
    }
    public createSubtableFragments(lookup: Gsub.Ligature, ctx: SubtableWriteContext<Gsub.Lookup>) {
        let state = new State();
        let frags: Frag[] = [];
        // Iterate the path map using post-root order to make sure that longer ligatures
        // is processed first.
        for (const { from, to } of lookup.mapping) {
            if (from.length < 1) continue; // meaningless, skip
            ctx.stat.setContext(from.length); // Stat
            const [g0, ...gCont] = from;
            if (state.tryAddMapping(g0, [gCont, to])) continue;
            this.flush(frags, state, ctx);
            state = new State();
            if (!state.tryAddMapping(g0, [gCont, to])) throw Errors.Unreachable();
        }
        this.flush(frags, state, ctx);
        return frags;
    }
}
