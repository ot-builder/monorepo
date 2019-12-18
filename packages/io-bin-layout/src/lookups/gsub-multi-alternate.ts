import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gsub, GsubGpos } from "@ot-builder/ft-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableSizeLimit,
    SubtableWriteContext
} from "../gsub-gpos-shared/general";
import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";

import { LookupIsGsubAlternateAlg, LookupIsGsubMultiAlg } from "./lookup-type-alg";
import { SimpleGidArray } from "./shared-types";

const SubtableFormat1 = {
    read(
        view: BinaryView,
        lookup: Gsub.Multiple | Gsub.Alternate,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        const format = view.uint16();
        Assert.FormatSupported(`MultipleSubst / AlternateSubst`, format, 1);
        const cov = view.next(Ptr16GidCoverage);
        const count = view.uint16();
        Assert.SizeMatch(`MultipleSubst / AlternateSubst count`, count, cov.length);
        for (const gid of cov) {
            const pSubst = view.ptr16();
            const substituteGlyphIDs = pSubst.next(SimpleGidArray);
            lookup.mapping.set(
                ctx.gOrd.at(gid),
                substituteGlyphIDs.map(g => ctx.gOrd.at(g))
            );
        }
    },
    write(
        frag: Frag,
        mapping: Map<OtGlyph, ReadonlyArray<OtGlyph>>,
        ctx: SubtableWriteContext<GsubGpos.Lookup>
    ) {
        const { gidList, values } = CovUtils.splitListFromMap(mapping, ctx.gOrd);
        frag.uint16(1);
        frag.push(Ptr16GidCoverage, gidList);
        frag.uint16(values.length);
        for (let to of values) {
            const fSeq = frag.ptr16New();
            fSeq.uint16(to.length);
            fSeq.array(
                UInt16,
                to.map(g => ctx.gOrd.reverse(g))
            );
        }
    }
};

class GsubMultiAlternateReaderBase {
    public parseSubtable(
        view: BinaryView,
        lookup: Gsub.Multiple | Gsub.Alternate,
        context: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, context);
                break;
            default:
                throw Errors.FormatNotSupported(`MultipleSubst / AlternateSubst`, format);
        }
    }
}

class State {
    public mapping: Map<OtGlyph, ReadonlyArray<OtGlyph>> = new Map();
    public size = UInt16.size * 4;

    public tryAddMapping(from: OtGlyph, to: ReadonlyArray<OtGlyph>) {
        const deltaSize = UInt16.size * (2 + to.length);
        if (this.size + deltaSize > SubtableSizeLimit) return false;
        this.mapping.set(from, to);
        this.size += deltaSize;
        return true;
    }
}

class GsubMultiAlternateWriterBase {
    public flush(frags: Frag[], state: State, ctx: SubtableWriteContext<GsubGpos.Lookup>) {
        if (!state.mapping.size) return;
        frags.push(Frag.from(SubtableFormat1, state.mapping, ctx));
    }
    public createSubtableFragments(
        lookup: Gsub.Multiple | Gsub.Alternate,
        ctx: SubtableWriteContext<GsubGpos.Lookup>
    ) {
        let state = new State();
        let frags: Frag[] = [];
        for (const [from, to] of lookup.mapping) {
            if (state.tryAddMapping(from, to)) continue;
            this.flush(frags, state, ctx);
            state = new State();
            if (!state.tryAddMapping(from, to)) throw Errors.Unreachable();
        }
        this.flush(frags, state, ctx);
        return frags;
    }
}

export class GsubMultiReader extends GsubMultiAlternateReaderBase
    implements LookupReader<GsubGpos.Lookup, Gsub.Multiple> {
    public createLookup() {
        return Gsub.Multiple.create();
    }
}
export class GsubAlternateReader extends GsubMultiAlternateReaderBase
    implements LookupReader<GsubGpos.Lookup, Gsub.Alternate> {
    public createLookup() {
        return Gsub.Alternate.create();
    }
}
export class GsubMultiWriter extends GsubMultiAlternateWriterBase
    implements LookupWriter<GsubGpos.Lookup, Gsub.Multiple> {
    public canBeUsed(l: GsubGpos.Lookup): l is Gsub.Multiple {
        return l.acceptLookupAlgebra(LookupIsGsubMultiAlg);
    }
    public getLookupType() {
        return 2;
    }
}
export class GsubAlternateWriter extends GsubMultiAlternateWriterBase
    implements LookupWriter<GsubGpos.Lookup, Gsub.Alternate> {
    public canBeUsed(l: GsubGpos.Lookup): l is Gsub.Alternate {
        return l.acceptLookupAlgebra(LookupIsGsubAlternateAlg);
    }
    public getLookupType() {
        return 3;
    }
}
