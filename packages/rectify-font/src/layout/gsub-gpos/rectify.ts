import * as Ot from "@ot-builder/font";
import { Data } from "@ot-builder/prelude";

import {
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../../interface";
import { RectifyImpl } from "../../shared";

export type RStub<C> = { demand: C; fill(dst: C): void };
export function RStub<C>(demand: C, fill: (dst: C) => void): RStub<C> {
    return { demand, fill };
}

export function rectifyLookupList<L, A>(
    lookups: L[],
    alg: A,
    app: (lookup: L, alg: A) => RStub<L>
): Map<L, L> {
    const replicateProcedures: RStub<L>[] = [];
    for (let lid = 0; lid < lookups.length; lid++) {
        const lookup = lookups[lid];
        replicateProcedures[lid] = app(lookup, alg);
    }
    for (let lid = 0; lid < lookups.length; lid++) {
        replicateProcedures[lid].fill(replicateProcedures[lid].demand);
    }
    const result = new Map<L, L>();
    for (let lid = 0; lid < lookups.length; lid++) {
        result.set(lookups[lid], replicateProcedures[lid].demand);
    }
    return result;
}

abstract class RectifyGlyphCoordAlgBase<L extends Ot.GsubGpos.LookupProp> {
    constructor(
        protected readonly rg: GlyphReferenceRectifier,
        protected readonly rc: CoordRectifier,
        protected readonly rap: Data.Maybe<PointAttachmentRectifier>
    ) {}

    protected _cache: WeakMap<L, RStub<L>> = new Map();

    protected setMeta(props: Ot.GsubGpos.LookupProp, ret: Ot.GsubGpos.LookupProp) {
        ret.rightToLeft = props.rightToLeft;
        ret.ignoreGlyphs = RectifyImpl.Glyph.setSome(this.rg, props.ignoreGlyphs || new Set());
    }

    protected processChainingRules(
        props: Ot.GsubGpos.ChainingProp<{ ref: L }>,
        ret: Ot.GsubGpos.ChainingProp<{ ref: L }>
    ) {
        ret.rules = [];
        for (const rule of props.rules) {
            const match1 = RectifyImpl.listAllT(this.rg, rule.match, RectifyImpl.Glyph.setAll);
            if (!match1 || !match1.length) continue;
            const applications1: Ot.GsubGpos.ChainingApplication<{ ref: L }>[] = [];
            for (const app of rule.applications) {
                const stub = this._cache.get(app.apply.ref);
                if (stub) applications1.push({ at: app.at, apply: { ref: stub.demand } });
            }
            ret.rules.push({
                match: match1,
                applications: applications1,
                inputBegins: rule.inputBegins,
                inputEnds: rule.inputEnds
            });
        }
    }

    public process(lookup: L): RStub<L> {
        const result = this.processImpl(lookup);
        this._cache.set(lookup, result);
        return result;
    }

    protected abstract processImpl(lookup: L): RStub<L>;
}

export class RectifyGsubGlyphCoordAlg extends RectifyGlyphCoordAlgBase<Ot.Gsub.Lookup> {
    protected processImpl(lookup: Ot.Gsub.Lookup): RStub<Ot.Gsub.Lookup> {
        switch (lookup.type) {
            case Ot.Gsub.LookupType.Single:
                return this.gsubSingle(lookup);
            case Ot.Gsub.LookupType.Multi:
                return this.gsubMulti(lookup);
            case Ot.Gsub.LookupType.Alternate:
                return this.gsubAlternate(lookup);
            case Ot.Gsub.LookupType.Ligature:
                return this.gsubLigature(lookup);
            case Ot.Gsub.LookupType.Chaining:
                return this.gsubChaining(lookup);
            case Ot.Gsub.LookupType.Reverse:
                return this.gsubReverse(lookup);
        }
    }

    private gsubSingle(props: Ot.Gsub.SingleProp): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.Single.create(), ret => {
            this.setMeta(props, ret);
            ret.mapping = RectifyImpl.Glyph.bimapSome(this.rg, props.mapping);
        });
    }

    private gsubMulti(props: Ot.Gsub.MultipleAlternateProp): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.Multiple.create(), ret => {
            this.setMeta(props, ret);
            ret.mapping = RectifyImpl.Glyph.mapSomeT(
                this.rg,
                props.mapping,
                RectifyImpl.Glyph.listAll
            );
        });
    }

    private gsubAlternate(props: Ot.Gsub.MultipleAlternateProp): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.Alternate.create(), ret => {
            this.setMeta(props, ret);
            ret.mapping = RectifyImpl.Glyph.mapSomeT(
                this.rg,
                props.mapping,
                RectifyImpl.Glyph.listAll
            );
        });
    }

    private gsubLigature(props: Ot.Gsub.LigatureProp): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.Ligature.create(), ret => {
            this.setMeta(props, ret);
            const mapping1: Array<Ot.Gsub.LigatureEntry> = [];
            for (const { from, to } of props.mapping) {
                const dst1 = this.rg.glyphRef(to);
                if (!dst1) continue;
                const src1 = RectifyImpl.Glyph.listAll(this.rg, from);
                if (!src1) continue;
                mapping1.push({ from: src1, to: dst1 });
            }
            ret.mapping = mapping1;
        });
    }

    private gsubReverse(props: Ot.Gsub.ReverseSubProp): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.ReverseSub.create(), ret => {
            this.setMeta(props, ret);
            ret.rules = RectifyImpl.listSomeT(this.rg, props.rules, (rec, rule) => {
                const match1 = RectifyImpl.listAllT(rec, rule.match, RectifyImpl.Glyph.setAll);
                const replace1 = RectifyImpl.Glyph.bimapSome(rec, rule.replacement);
                if (!match1 || !replace1) return null;
                else return { ...rule, match: match1, replacement: replace1 };
            });
        });
    }

    private gsubChaining(
        props: Ot.Gsub.ChainingProp<{ ref: Ot.Gsub.Lookup }>
    ): RStub<Ot.Gsub.Lookup> {
        return RStub(Ot.Gsub.Chaining.create(), ret => {
            this.setMeta(props, ret);
            this.processChainingRules(props, ret);
        });
    }
}

export class RectifyGposGlyphCoordAlg extends RectifyGlyphCoordAlgBase<Ot.Gpos.Lookup> {
    protected processImpl(lookup: Ot.Gpos.Lookup): RStub<Ot.Gpos.Lookup> {
        switch (lookup.type) {
            case Ot.Gpos.LookupType.Single:
                return this.gposSingle(lookup);
            case Ot.Gpos.LookupType.Pair:
                return this.gposPair(lookup);
            case Ot.Gpos.LookupType.Cursive:
                return this.gposCursive(lookup);
            case Ot.Gpos.LookupType.MarkToBase:
                return this.gposMarkToBase(lookup);
            case Ot.Gpos.LookupType.MarkToLigature:
                return this.gposMarkToLigature(lookup);
            case Ot.Gpos.LookupType.MarkToMark:
                return this.gposMarkToMark(lookup);
            case Ot.Gpos.LookupType.Chaining:
                return this.gposChaining(lookup);
        }
    }

    public gposSingle(props: Ot.Gpos.SingleProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.Single.create(), ret => {
            this.setMeta(props, ret);
            ret.adjustments = RectifyImpl.Glyph.mapSomeT(this.rg, props.adjustments, (rec, x) =>
                rectifyAdjustment(this.rc, x)
            );
        });
    }

    public gposPair(props: Ot.Gpos.PairProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.Pair.create(), ret => {
            this.setMeta(props, ret);

            const rep = props.adjustments.toRep();
            for (let c1 = 0; c1 < rep.xClasses.length; c1++) {
                rep.xClasses[c1] = RectifyImpl.Glyph.listSome(this.rg, rep.xClasses[c1]);
            }
            for (let c2 = 0; c2 < rep.yClasses.length; c2++) {
                rep.yClasses[c2] = RectifyImpl.Glyph.listSome(this.rg, rep.yClasses[c2]);
            }
            for (let c1 = 0; c1 < rep.data.length; c1++) {
                const row = rep.data[c1];
                for (let c2 = 0; c2 < row.length; c2++) {
                    const adj = row[c2];
                    if (adj == null) continue;
                    row[c2] = [
                        rectifyAdjustment(this.rc, adj[0]),
                        rectifyAdjustment(this.rc, adj[1])
                    ];
                }
            }
            ret.adjustments = Ot.DicingStore.create(rep);
        });
    }

    public gposCursive(props: Ot.Gpos.CursiveProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.Cursive.create(), ret => {
            this.setMeta(props, ret);
            ret.attachments = RectifyImpl.mapSome2T(
                this.rg,
                props.attachments,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyAnchorPairAP(this.rap, g, rectifyAnchorPair(this.rc, x))
            );
        });
    }

    public gposMarkToBase(props: Ot.Gpos.MarkToBaseProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.MarkToBase.create(), ret => {
            this.setMeta(props, ret);
            ret.marks = RectifyImpl.mapSome2T(
                this.rg,
                props.marks,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
            );
            ret.bases = RectifyImpl.mapSome2T(
                this.rg,
                props.bases,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyBaseRecordAP(this.rap, g, rectifyBaseRecord(this.rc, x))
            );
        });
    }

    public gposMarkToMark(props: Ot.Gpos.MarkToMarkProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.MarkToMark.create(), ret => {
            this.setMeta(props, ret);
            ret.marks = RectifyImpl.mapSome2T(
                this.rg,
                props.marks,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
            );
            ret.baseMarks = RectifyImpl.mapSome2T(
                this.rg,
                props.baseMarks,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyBaseRecordAP(this.rap, g, rectifyBaseRecord(this.rc, x))
            );
        });
    }

    public gposMarkToLigature(props: Ot.Gpos.MarkToLigatureProp): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.MarkToLigature.create(), ret => {
            this.setMeta(props, ret);
            ret.marks = RectifyImpl.mapSome2T(
                this.rg,
                props.marks,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) => rectifyMarkRecordAP(this.rap, g, rectifyMarkRecord(this.rc, x))
            );
            ret.bases = RectifyImpl.mapSome2T(
                this.rg,
                props.bases,
                (rg, g) => rg.glyphRef(g),
                (rg, g, x) =>
                    rectifyLigatureRecordAP(this.rap, g, rectifyLigatureRecord(this.rc, x))
            );
        });
    }

    public gposChaining(
        props: Ot.GsubGpos.ChainingProp<{ ref: Ot.Gpos.Lookup }>
    ): RStub<Ot.Gpos.Lookup> {
        return RStub(Ot.Gpos.Chaining.create(), ret => {
            this.setMeta(props, ret);
            this.processChainingRules(props, ret);
        });
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
