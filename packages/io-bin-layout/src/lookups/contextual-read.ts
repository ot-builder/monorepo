import { BinaryView } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gpos, Gsub, GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";

import { LookupReader, SubtableReadingContext } from "../gsub-gpos-shared/general";
import { ClassDef } from "../shared/class-def";
import { CovUtils, GidCoverage, Ptr16GlyphCoverage } from "../shared/coverage";

import { SimpleClassIdArray, SimpleCoverageArray, SimpleOffsetArray } from "./shared-types";

interface Resolver {
    toGlyphSet(id: number, atStartPosition: boolean): Set<OtGlyph>;
}
class IndividualResolver<L> implements Resolver {
    constructor(private ctx: SubtableReadingContext<L>) {}
    public toGlyphSet(id: number) {
        return new Set([this.ctx.gOrd.at(id)]);
    }
}
class ClassResolver implements Resolver {
    constructor(private cd: GsubGpos.ClassDef, private startCoverageSet: Set<OtGlyph>) {}
    public toGlyphSet(id: number, start: boolean) {
        const gs = new Set<OtGlyph>();
        for (const [g, cls] of this.cd) {
            if (cls === id && (!start || this.startCoverageSet.has(g))) gs.add(g);
        }
        return gs;
    }
}

// Readers
class CApplication<L> {
    public read(view: BinaryView, siblings: Data.Order<L>) {
        const glyphSequenceIndex = view.uint16();
        const lookupListIndex = view.uint16();
        const lookup = siblings.at(lookupListIndex);
        return { at: glyphSequenceIndex, apply: lookup };
    }
}

class CIndividualClassRule<L> {
    private rApplication = new CApplication<L>();
    public read(
        view: BinaryView,
        isChaining: boolean,
        startGlyphs: Set<OtGlyph>,
        srBacktrack: Resolver,
        srInput: Resolver,
        srLookAhead: Resolver,
        siblings: Data.Order<L>
    ) {
        let gssBacktrack: Array<Set<OtGlyph>> = [];
        const inputSequence: Array<Set<OtGlyph>> = [startGlyphs];
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
        const rule: GsubGpos.ChainingRule<L> = {
            match: [...gssBacktrack, ...inputSequence, ...lookAheadSequence],
            inputBegins: gssBacktrack.length,
            inputEnds: gssBacktrack.length + inputSequence.length,
            applications: []
        };
        for (let a = 0; a < applicationCount; a++) {
            rule.applications[a] = view.next(this.rApplication, siblings);
        }
        return rule;
    }
}
class IndividualClassRuleSet<L> {
    private rIndividualClassRule = new CIndividualClassRule<L>();
    public read(
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingProp<L>,
        startGlyphs: Set<OtGlyph>,
        srBacktrack: Resolver,
        srInput: Resolver,
        srLookAhead: Resolver,
        siblings: Data.Order<L>
    ) {
        const apRules = view.next(SimpleOffsetArray);
        for (const vRule of apRules) {
            lookup.rules.push(
                vRule.next(
                    this.rIndividualClassRule,
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
}

class SubtableFormat1<L> {
    private rIndividualClassRuleSet = new IndividualClassRuleSet<L>();
    public read(
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingProp<L>,
        ctx: SubtableReadingContext<L>
    ) {
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
                this.rIndividualClassRuleSet,
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
}

class SubtableFormat2<L> {
    private rIndividualClassRuleSet = new IndividualClassRuleSet<L>();
    public read(
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingProp<L>,
        ctx: SubtableReadingContext<L>
    ) {
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
                this.rIndividualClassRuleSet,
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
}

class SubtableFormat3<L> {
    private rApplication = new CApplication<L>();

    public read(
        view: BinaryView,
        isChaining: boolean,
        lookup: GsubGpos.ChainingProp<L>,
        ctx: SubtableReadingContext<L>
    ) {
        const format = view.uint16();
        Assert.FormatSupported(`[Chain]ContextSubstFormat3`, format, 3);

        let gssBacktrack: Array<Set<OtGlyph>>;
        const gssInput: Array<Set<OtGlyph>> = [];
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

        const rule: GsubGpos.ChainingRule<L> = {
            match: [...gssBacktrack, ...gssInput, ...gssLookAhead],
            inputBegins: gssBacktrack.length,
            inputEnds: gssBacktrack.length + gssInput.length,
            applications: []
        };

        for (let a = 0; a < applicationCount; a++) {
            rule.applications[a] = view.next(this.rApplication, ctx.crossReferences);
        }

        lookup.rules.push(rule);
    }
}

abstract class ChainingContextualReader<L, CL extends L & GsubGpos.ChainingProp<L>>
    implements LookupReader<L, CL> {
    constructor(private chaining: boolean) {}
    public abstract createLookup(): CL;

    public parseSubtable(view: BinaryView, lookup: CL, ctx: SubtableReadingContext<L>) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(new SubtableFormat1<L>(), this.chaining, lookup, ctx);
                break;
            case 2:
                view.next(new SubtableFormat2<L>(), this.chaining, lookup, ctx);
                break;
            case 3:
                view.next(new SubtableFormat3<L>(), this.chaining, lookup, ctx);
                break;
            default:
                throw Errors.FormatNotSupported(`chaining subtable`, format);
        }
    }
}

export class GsubContextualReader extends ChainingContextualReader<Gsub.Lookup, Gsub.Chaining> {
    constructor() {
        super(false);
    }
    public createLookup() {
        return Gsub.Chaining.create();
    }
}
export class GsubChainingReader extends ChainingContextualReader<Gsub.Lookup, Gsub.Chaining> {
    constructor() {
        super(true);
    }
    public createLookup() {
        return Gsub.Chaining.create();
    }
}
export class GposContextualReader extends ChainingContextualReader<Gpos.Lookup, Gpos.Chaining> {
    constructor() {
        super(false);
    }
    public createLookup() {
        return Gpos.Chaining.create();
    }
}
export class GposChainingReader extends ChainingContextualReader<Gpos.Lookup, Gpos.Chaining> {
    constructor() {
        super(true);
    }
    public createLookup() {
        return Gpos.Chaining.create();
    }
}
