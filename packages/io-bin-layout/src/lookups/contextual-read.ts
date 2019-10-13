import { BinaryView, Read } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gpos, Gsub, GsubGpos, LayoutCommon } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";

import { LookupReader, SubtableReadingContext } from "../gsub-gpos-shared/general";
import { ClassDef } from "../shared/class-def";
import { CovUtils, GidCoverage, Ptr16GlyphCoverage } from "../shared/coverage";

import { SimpleClassIdArray, SimpleCoverageArray, SimpleOffsetArray } from "./shared-types";

interface Resolver {
    toGlyphSet(id: number, atStartPosition: boolean): Set<OtGlyph>;
}
class IndividualResolver implements Resolver {
    constructor(private ctx: SubtableReadingContext<GsubGpos.Lookup>) {}
    public toGlyphSet(id: number) {
        return new Set([this.ctx.gOrd.at(id)]);
    }
}
class ClassResolver implements Resolver {
    constructor(
        private cd: LayoutCommon.ClassDef.T<OtGlyph>,
        private startCoverageSet: Set<OtGlyph>
    ) {}
    public toGlyphSet(id: number, start: boolean) {
        const gs = new Set<OtGlyph>();
        for (const [g, cls] of this.cd) {
            if (cls === id && (!start || this.startCoverageSet.has(g))) gs.add(g);
        }
        return gs;
    }
}

// Readers
const Application = Read((view, siblings: Data.Order<GsubGpos.Lookup>) => {
    const glyphSequenceIndex = view.uint16();
    const lookupListIndex = view.uint16();
    const lookup = siblings.at(lookupListIndex);
    return { at: glyphSequenceIndex, lookup } as GsubGpos.ChainingApplication;
});

const IndividualClassRule = Read(
    (
        view: BinaryView,
        isChaining: boolean,
        startGlyphs: Set<OtGlyph>,
        srBacktrack: Resolver,
        srInput: Resolver,
        srLookAhead: Resolver,
        siblings: Data.Order<GsubGpos.Lookup>
    ) => {
        let gssBacktrack: Array<Set<OtGlyph>> = [];
        let inputSequence: Array<Set<OtGlyph>> = [startGlyphs];
        let lookAheadSequence: Array<Set<OtGlyph>> = [];
        let applicationCount = 0;
        if (isChaining) {
            const backtrackIDs = view.next(SimpleClassIdArray).reverse();
            gssBacktrack = backtrackIDs.map(n => srBacktrack.toGlyphSet(n, false));
        }
        const glyphCount = view.uint16();
        if (!isChaining) applicationCount = view.uint16();
        for (let n = 1; n < glyphCount; n++) {
            //       ^ Start from 1 here
            inputSequence[n] = srInput.toGlyphSet(view.uint16(), false);
        }
        if (isChaining) {
            const lookAheadIDs = view.next(SimpleClassIdArray);
            lookAheadSequence = lookAheadIDs.map(n => srLookAhead.toGlyphSet(n, false));
            applicationCount = view.uint16();
        }
        const rule: GsubGpos.ChainingRule = {
            match: [...gssBacktrack, ...inputSequence, ...lookAheadSequence],
            inputBegins: gssBacktrack.length,
            inputEnds: gssBacktrack.length + inputSequence.length,
            applications: []
        };
        for (let a = 0; a < applicationCount; a++) {
            rule.applications[a] = view.next(Application, siblings);
        }
        return rule;
    }
);
const IndividualClassRuleSet = Read(
    (
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingLookup,
        startGlyphs: Set<OtGlyph>,
        srBacktrack: Resolver,
        srInput: Resolver,
        srLookAhead: Resolver,
        siblings: Data.Order<GsubGpos.Lookup>
    ) => {
        const apRules = view.next(SimpleOffsetArray);
        for (const vRule of apRules) {
            lookup.rules.push(
                vRule.next(
                    IndividualClassRule,
                    isChaining,
                    startGlyphs,
                    srBacktrack,
                    srInput,
                    srLookAhead,
                    siblings
                )
            );
        }
    }
);

const SubtableFormat1 = Read(
    (
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingLookup,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) => {
        const format = view.uint16();
        Assert.FormatSupported(`[Chain]ContextSubstFormat1`, format, 1);

        const cov = view.ptr16().next(GidCoverage);
        const solver = new IndividualResolver(ctx);

        const chainSubRuleCount = view.uint16();
        for (let rid = 0; rid < chainSubRuleCount; rid++) {
            const startGlyph = ctx.gOrd.at(cov[rid]);

            const pRuleSet = view.ptr16Nullable();
            if (!pRuleSet) continue; //skip nullptr (though it is not allowed in spec)

            const startGlyphSet = new Set([startGlyph]);
            pRuleSet.next(
                IndividualClassRuleSet,
                isChaining,
                lookup,
                startGlyphSet,
                solver,
                solver,
                solver,
                ctx.crossReferences
            );
        }
    }
);

const SubtableFormat2 = Read(
    (
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingLookup,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) => {
        const format = view.uint16();
        Assert.FormatSupported(`[Chain]ContextSubstFormat2`, format, 2);

        const cov = view.ptr16().next(GidCoverage);

        const cdBacktrack = isChaining ? view.ptr16().next(ClassDef, ctx.gOrd) : new Map();
        const cdInput = view.ptr16().next(ClassDef, ctx.gOrd);
        const cdLookAhead = isChaining ? view.ptr16().next(ClassDef, ctx.gOrd) : new Map();

        const covGlyphSet = CovUtils.glyphSetFromGidList(cov, ctx.gOrd);
        for (const g of ctx.gOrd) {
            if (!cdBacktrack.get(g)) cdBacktrack.set(g, 0);
            if (!cdInput.get(g)) cdInput.set(g, 0);
            if (!cdLookAhead.get(g)) cdLookAhead.set(g, 0);
        }

        const srBacktrack = new ClassResolver(cdBacktrack, covGlyphSet);
        const srInput = new ClassResolver(cdInput, covGlyphSet);
        const srLookAhead = new ClassResolver(cdLookAhead, covGlyphSet);

        for (const [pp, index] of view.repeat(view.uint16())) {
            const pRuleSet = pp.ptr16Nullable();
            if (!pRuleSet) continue; // skip nullptr

            const startGlyphSet = srInput.toGlyphSet(index, true);
            pRuleSet.next(
                IndividualClassRuleSet,
                isChaining,
                lookup,
                startGlyphSet,
                srBacktrack,
                srInput,
                srLookAhead,
                ctx.crossReferences
            );
        }
    }
);

const SubtableFormat3 = Read(
    (
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingLookup,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) => {
        const format = view.uint16();
        Assert.FormatSupported(`[Chain]ContextSubstFormat3`, format, 3);

        let gssBacktrack: Array<Set<OtGlyph>>;
        let gssInput: Array<Set<OtGlyph>> = [];
        let gssLookAhead: Array<Set<OtGlyph>>;
        let applicationCount = 0;

        if (isChaining) {
            gssBacktrack = view.next(SimpleCoverageArray, ctx.gOrd).reverse();
        } else {
            gssBacktrack = [];
        }

        const glyphCount = view.uint16();
        if (!isChaining) applicationCount = view.uint16();
        for (let n = 0; n < glyphCount; n++) {
            //       ^ Start from 0 here
            gssInput[n] = view.next(Ptr16GlyphCoverage, ctx.gOrd);
        }

        if (isChaining) {
            gssLookAhead = view.next(SimpleCoverageArray, ctx.gOrd);
            applicationCount = view.uint16();
        } else {
            gssLookAhead = [];
        }

        const rule: GsubGpos.ChainingRule = {
            match: [...gssBacktrack, ...gssInput, ...gssLookAhead],
            inputBegins: gssBacktrack.length,
            inputEnds: gssBacktrack.length + gssInput.length,
            applications: []
        };

        for (let a = 0; a < applicationCount; a++) {
            rule.applications[a] = view.next(Application, ctx.crossReferences);
        }

        lookup.rules.push(rule);
    }
);

abstract class ChainingContextualReader
    implements LookupReader<GsubGpos.Lookup, GsubGpos.ChainingLookup> {
    constructor(private chaining: boolean) {}
    public abstract createLookup(): GsubGpos.ChainingLookup;

    public parseSubtable(
        view: BinaryView,
        lookup: GsubGpos.ChainingLookup,
        ctx: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, this.chaining, lookup, ctx);
                break;
            case 2:
                view.next(SubtableFormat2, this.chaining, lookup, ctx);
                break;
            case 3:
                view.next(SubtableFormat3, this.chaining, lookup, ctx);
                break;
            default:
                throw Errors.FormatNotSupported(`chaining subtable`, format);
        }
    }
}

export class GsubContextualReader extends ChainingContextualReader {
    constructor() {
        super(false);
    }
    public createLookup() {
        return new Gsub.Chaining();
    }
}
export class GsubChainingReader extends ChainingContextualReader {
    constructor() {
        super(true);
    }
    public createLookup() {
        return new Gsub.Chaining();
    }
}
export class GposContextualReader extends ChainingContextualReader {
    constructor() {
        super(false);
    }
    public createLookup() {
        return new Gpos.Chaining();
    }
}
export class GposChainingReader extends ChainingContextualReader {
    constructor() {
        super(true);
    }
    public createLookup() {
        return new Gpos.Chaining();
    }
}
