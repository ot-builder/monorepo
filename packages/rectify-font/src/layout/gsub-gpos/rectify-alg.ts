import * as Ot from "@ot-builder/font";
import { Data, Thunk } from "@ot-builder/prelude";

import {
    CoordRectifier,
    GlyphRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../../interface";
import { RectifyImpl } from "../../shared";

export type RStub<C> = { demand: C; fill(dst: C): void };
export type RProc<L> = <R>(cont: <C extends L>(repl: RStub<C>) => R) => R;

export function rectifyLookupList<L, A>(
    lookups: L[],
    alg: A,
    app: (lookup: L, alg: A) => RProc<L>
): Map<L, L> {
    const replicateProcedures: RProc<L>[] = [];
    for (let lid = 0; lid < lookups.length; lid++) {
        const lookup = lookups[lid];
        replicateProcedures[lid] = app(lookup, alg);
    }
    for (let lid = 0; lid < lookups.length; lid++) {
        replicateProcedures[lid](repl => repl.fill(repl.demand));
    }
    const result = new Map<L, L>();
    for (let lid = 0; lid < lookups.length; lid++) {
        replicateProcedures[lid](repl => result.set(lookups[lid], repl.demand));
    }
    return result;
}

class RectifyGsubGlyphCoordAlgBase<L extends Ot.GsubGpos.LookupProp> {
    constructor(
        protected readonly rg: GlyphRectifier,
        protected readonly rc: CoordRectifier,
        protected readonly rap: Data.Maybe<PointAttachmentRectifier>
    ) {}

    protected _cache: Map<object, RProc<L>> = new Map();
    public crossReference(a: object, thValue: Thunk<RProc<L>>) {
        const existing = this._cache.get(a);
        if (existing) return existing;
        const novel = thValue.force();
        this._cache.set(a, novel);
        return novel;
    }

    protected setMeta(props: Ot.GsubGpos.LookupProp, ret: Ot.GsubGpos.LookupProp) {
        ret.rightToLeft = props.rightToLeft;
        ret.ignoreGlyphs = RectifyImpl.Glyph.setSome(this.rg, props.ignoreGlyphs || new Set());
    }

    protected processChainingRules(
        props: Ot.GsubGpos.ChainingProp<RProc<L>>,
        ret: Ot.GsubGpos.ChainingProp<L>
    ) {
        ret.rules = [];
        for (const rule of props.rules) {
            const match1 = RectifyImpl.listAllT(this.rg, rule.match, RectifyImpl.Glyph.setAll);
            if (!match1 || !match1.length) continue;
            const applications1: Ot.GsubGpos.ChainingApplication<L>[] = [];
            for (const app of rule.applications) {
                let lookup1: null | L = null;
                app.apply(repl => (lookup1 = repl.demand));
                if (lookup1) applications1.push({ at: app.at, apply: lookup1 });
            }
            ret.rules.push({
                match: match1,
                applications: applications1,
                inputBegins: rule.inputBegins,
                inputEnds: rule.inputEnds
            });
        }
    }
}

export class RectifyGsubGlyphCoordAlg extends RectifyGsubGlyphCoordAlgBase<Ot.Gsub.Lookup>
    implements Ot.Gsub.LookupAlg<RProc<Ot.Gsub.Lookup>> {
    public gsubSingle(thProps: Thunk<Ot.Gsub.SingleProp>): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.Single> = {
            demand: Ot.Gsub.Single.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.mapping = RectifyImpl.Glyph.bimapSome(this.rg, props.mapping);
            }
        };
        return cont => cont(stub);
    }

    public gsubMulti(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.Multiple> = {
            demand: Ot.Gsub.Multiple.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.mapping = RectifyImpl.Glyph.mapSomeT(
                    this.rg,
                    props.mapping,
                    RectifyImpl.Glyph.listAll
                );
            }
        };
        return cont => cont(stub);
    }

    public gsubAlternate(thProps: Thunk<Ot.Gsub.MultipleAlternateProp>): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.Alternate> = {
            demand: Ot.Gsub.Alternate.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.mapping = RectifyImpl.Glyph.mapSomeT(
                    this.rg,
                    props.mapping,
                    RectifyImpl.Glyph.listAll
                );
            }
        };
        return cont => cont(stub);
    }

    public gsubLigature(thProps: Thunk<Ot.Gsub.LigatureProp>): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.Ligature> = {
            demand: Ot.Gsub.Ligature.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                const mapping1: Array<Ot.Gsub.LigatureEntry> = [];
                for (const { from, to } of props.mapping) {
                    const dst1 = this.rg.glyph(to);
                    if (!dst1) continue;
                    const src1 = RectifyImpl.Glyph.listAll(this.rg, from);
                    if (!src1) continue;
                    mapping1.push({ from: src1, to: dst1 });
                }
                ret.mapping = mapping1;
            }
        };
        return cont => cont(stub);
    }

    public gsubReverse(thProps: Thunk<Ot.Gsub.ReverseSubProp>): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.ReverseSub> = {
            demand: Ot.Gsub.ReverseSub.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.rules = RectifyImpl.listSomeT(this.rg, props.rules, (rec, rule) => {
                    const match1 = RectifyImpl.listAllT(rec, rule.match, RectifyImpl.Glyph.setAll);
                    const replace1 = RectifyImpl.Glyph.bimapSome(rec, rule.replacement);
                    if (!match1 || !replace1) return null;
                    else return { ...rule, match: match1, replacement: replace1 };
                });
            }
        };
        return cont => cont(stub);
    }

    public gsubChaining(
        thProps: Thunk<Ot.GsubGpos.ChainingProp<RProc<Ot.Gsub.Lookup>>>
    ): RProc<Ot.Gsub.Lookup> {
        const stub: RStub<Ot.Gsub.Chaining> = {
            demand: Ot.Gsub.Chaining.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                this.processChainingRules(props, ret);
            }
        };
        return cont => cont(stub);
    }
}
export class RectifyGposGlyphCoordAlg extends RectifyGsubGlyphCoordAlgBase<Ot.Gpos.Lookup>
    implements Ot.Gpos.LookupAlg<RProc<Ot.Gpos.Lookup>> {
    public gposSingle(thProps: Thunk<Ot.Gpos.SingleProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.Single> = {
            demand: Ot.Gpos.Single.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.adjustments = RectifyImpl.Glyph.mapSomeT(
                    this.rg,
                    props.adjustments,
                    (rec, x) => rectifyAdjustment(this.rc, x)
                );
            }
        };
        return cont => cont(stub);
    }

    public gposPair(thProps: Thunk<Ot.Gpos.PairProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.Pair> = {
            demand: Ot.Gpos.Pair.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                const cdFirst = props.adjustments.getXClassDef();
                const cdSecond = props.adjustments.getYClassDef();
                for (let c1 = 0; c1 < cdFirst.length; c1++) {
                    for (let c2 = 0; c2 < cdSecond.length; c2++) {
                        const adj = props.adjustments.getByClass(c1, c2);
                        if (adj == null) continue;
                        const cFirst1 = RectifyImpl.Glyph.listSome(this.rg, cdFirst[c1]);
                        const cSecond1 = RectifyImpl.Glyph.listSome(this.rg, cdSecond[c2]);
                        if (!cFirst1 || !cFirst1.length || !cSecond1 || !cSecond1.length) {
                            continue;
                        }
                        ret.adjustments.set(new Set(cFirst1), new Set(cSecond1), [
                            rectifyAdjustment(this.rc, adj[0]),
                            rectifyAdjustment(this.rc, adj[1])
                        ]);
                    }
                }
            }
        };
        return cont => cont(stub);
    }

    public gposCursive(thProps: Thunk<Ot.Gpos.CursiveProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.Cursive> = {
            demand: Ot.Gpos.Cursive.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.attachments = RectifyImpl.mapSome2T(
                    this.rg,
                    props.attachments,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyAnchorPairAP(this.rap, g, rectifyAnchorPair(this.rc, x))
                );
            }
        };
        return cont => cont(stub);
    }

    public gposMarkToBase(thProps: Thunk<Ot.Gpos.MarkToBaseProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.MarkToBase> = {
            demand: Ot.Gpos.MarkToBase.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.marks = RectifyImpl.mapSome2T(
                    this.rg,
                    props.marks,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
                );
                ret.bases = RectifyImpl.mapSome2T(
                    this.rg,
                    props.bases,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyBaseRecordAP(this.rap, g, rectifyBaseRecord(this.rc, x))
                );
            }
        };
        return cont => cont(stub);
    }

    public gposMarkToMark(thProps: Thunk<Ot.Gpos.MarkToMarkProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.MarkToMark> = {
            demand: Ot.Gpos.MarkToMark.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.marks = RectifyImpl.mapSome2T(
                    this.rg,
                    props.marks,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
                );
                ret.baseMarks = RectifyImpl.mapSome2T(
                    this.rg,
                    props.baseMarks,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyBaseRecordAP(this.rap, g, rectifyBaseRecord(this.rc, x))
                );
            }
        };
        return cont => cont(stub);
    }

    public gposMarkToLigature(thProps: Thunk<Ot.Gpos.MarkToLigatureProp>): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.MarkToLigature> = {
            demand: Ot.Gpos.MarkToLigature.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                ret.marks = RectifyImpl.mapSome2T(
                    this.rg,
                    props.marks,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
                );
                ret.bases = RectifyImpl.mapSome2T(
                    this.rg,
                    props.bases,
                    (rg, g) => rg.glyph(g),
                    (rg, g, x) =>
                        rectifyLigatureRecordAP(this.rap, g, rectifyLigatureRecord(this.rc, x))
                );
            }
        };
        return cont => cont(stub);
    }

    public gposChaining(
        thProps: Thunk<Ot.GsubGpos.ChainingProp<RProc<Ot.Gpos.Lookup>>>
    ): RProc<Ot.Gpos.Lookup> {
        const stub: RStub<Ot.Gpos.Chaining> = {
            demand: Ot.Gpos.Chaining.create(),
            fill: ret => {
                const props = thProps.force();
                this.setMeta(props, ret);
                this.processChainingRules(props, ret);
            }
        };
        return cont => cont(stub);
    }
}

// Helper functions
function rectifyAdjustment(rec: CoordRectifier, adj: Ot.Gpos.Adjustment) {
    return {
        ...adj,
        dX: rec.coord(adj.dX),
        dY: rec.coord(adj.dY),
        dWidth: rec.coord(adj.dWidth),
        dHeight: rec.coord(adj.dHeight)
    };
}
function rectifyAnchor(rec: CoordRectifier, anc: Ot.Gpos.Anchor) {
    return { ...anc, x: rec.coord(anc.x), y: rec.coord(anc.y) };
}
function rectifyAnchorAP(
    rectifier: Data.Maybe<PointAttachmentRectifier>,
    context: Ot.Glyph,
    z: Ot.Gpos.Anchor
) {
    if (!rectifier || !z.attachToPoint) return z;
    const desired = RectifyImpl.getGlyphPoints(context)[z.attachToPoint.pointIndex];
    if (!desired) return { ...z, attachToPoint: null };
    const accept = rectifier.acceptOffset(desired, z);
    if (accept.x && accept.y) return z;
    switch (rectifier.manner) {
        case PointAttachmentRectifyManner.TrustAttachment:
            return { ...z, x: desired.x, y: desired.y };
        case PointAttachmentRectifyManner.TrustCoordinate:
            return { ...z, attachToPoint: null };
    }
}
function rectifyAnchorPair(rec: CoordRectifier, ap: Ot.Gpos.CursiveAnchorPair) {
    return {
        entry: !ap.entry ? ap.entry : rectifyAnchor(rec, ap.entry),
        exit: !ap.exit ? ap.exit : rectifyAnchor(rec, ap.exit)
    };
}
function rectifyAnchorPairAP(
    rectifier: Data.Maybe<PointAttachmentRectifier>,
    context: Ot.Glyph,
    ap: Ot.Gpos.CursiveAnchorPair
) {
    return {
        entry: !ap.entry ? ap.entry : rectifyAnchorAP(rectifier, context, ap.entry),
        exit: !ap.exit ? ap.exit : rectifyAnchorAP(rectifier, context, ap.exit)
    };
}
function rectifyMarkRecord(rec: CoordRectifier, mr: Ot.Gpos.MarkRecord) {
    const mr1: Ot.Gpos.MarkRecord = { markAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.markAnchors.length; clsAnchor++) {
        const a = mr.markAnchors[clsAnchor];
        if (!a) mr1.markAnchors[clsAnchor] = a;
        else mr1.markAnchors[clsAnchor] = rectifyAnchor(rec, a);
    }
    return mr1;
}
function rectifyMarkRecordAP(
    rec: Data.Maybe<PointAttachmentRectifier>,
    glyph: Ot.Glyph,
    mr: Ot.Gpos.MarkRecord
) {
    const mr1: Ot.Gpos.MarkRecord = { markAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.markAnchors.length; clsAnchor++) {
        const a = mr.markAnchors[clsAnchor];
        if (!a) mr1.markAnchors[clsAnchor] = a;
        else {
            mr1.markAnchors[clsAnchor] = rectifyAnchorAP(rec, glyph, a);
        }
    }
    return mr1;
}
function rectifyBaseRecord(rec: CoordRectifier, mr: Ot.Gpos.BaseRecord) {
    const mr1: Ot.Gpos.BaseRecord = { baseAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
        const a = mr.baseAnchors[clsAnchor];
        if (!a) mr1.baseAnchors[clsAnchor] = a;
        else mr1.baseAnchors[clsAnchor] = rectifyAnchor(rec, a);
    }
    return mr1;
}
function rectifyBaseRecordAP(
    rec: Data.Maybe<PointAttachmentRectifier>,
    glyph: Ot.Glyph,
    mr: Ot.Gpos.BaseRecord
) {
    const mr1: Ot.Gpos.BaseRecord = { baseAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
        const a = mr.baseAnchors[clsAnchor];
        if (!a) mr1.baseAnchors[clsAnchor] = a;
        else {
            mr1.baseAnchors[clsAnchor] = rectifyAnchorAP(rec, glyph, a);
        }
    }
    return mr1;
}
function rectifyLigatureRecord(rec: CoordRectifier, mr: Ot.Gpos.LigatureBaseRecord) {
    const mr1: Ot.Gpos.LigatureBaseRecord = { baseAnchors: [] };
    for (let part = 0; part < mr.baseAnchors.length; part++) {
        mr1.baseAnchors[part] = [];
        for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
            const a = mr.baseAnchors[part][clsAnchor];
            if (!a) mr1.baseAnchors[part][clsAnchor] = a;
            else mr1.baseAnchors[part][clsAnchor] = rectifyAnchor(rec, a);
        }
    }
    return mr1;
}
function rectifyLigatureRecordAP(
    rec: Data.Maybe<PointAttachmentRectifier>,
    glyph: Ot.Glyph,
    mr: Ot.Gpos.LigatureBaseRecord
) {
    const mr1: Ot.Gpos.LigatureBaseRecord = { baseAnchors: [] };
    for (let part = 0; part < mr.baseAnchors.length; part++) {
        mr1.baseAnchors[part] = [];
        for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
            const a = mr.baseAnchors[part][clsAnchor];
            if (!a) mr1.baseAnchors[part][clsAnchor] = a;
            else {
                mr1.baseAnchors[part][clsAnchor] = rectifyAnchorAP(rec, glyph, a);
            }
        }
    }
    return mr1;
}
