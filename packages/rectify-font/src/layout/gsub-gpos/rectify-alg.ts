import { RectifyImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Data, Rectify } from "@ot-builder/prelude";

import { LookupRemovableAlg } from "./lookup-removable-alg";

export class RectifyGlyphCoordAlg implements Ot.GsubGpos.LookupAlg<Ot.GsubGpos.Lookup> {
    constructor(
        private readonly rg: Rectify.Glyph.RectifierT<Ot.Glyph>,
        private readonly rc: Rectify.Coord.RectifierT<Ot.Var.Value>,
        private readonly rap: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>
    ) {}
    private _cache: Map<Ot.GsubGpos.LookupProp, Ot.GsubGpos.Lookup> = new Map();
    private removable = new LookupRemovableAlg();

    private cache(props: Ot.GsubGpos.LookupProp, ret: Ot.GsubGpos.Lookup) {
        this._cache.set(props, ret);
        return ret;
    }
    private setMeta(props: Ot.GsubGpos.LookupProp, ret: Ot.GsubGpos.Lookup) {
        ret.rightToLeft = props.rightToLeft;
        ret.ignoreGlyphs = RectifyImpl.Glyph.setSome(this.rg, props.ignoreGlyphs || new Set());
    }
    public allLookups(): Set<Ot.GsubGpos.Lookup> {
        return new Set(this._cache.values());
    }

    public gsubSingle(props: Ot.Gsub.SingleProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gsub.Single();
        this.setMeta(props, ret);
        ret.mapping = RectifyImpl.Glyph.bimapSome(this.rg, props.mapping);
        return this.cache(props, ret);
    }

    public gsubMulti(props: Ot.Gsub.MultipleAlternateProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gsub.Multiple();
        this.setMeta(props, ret);
        ret.mapping = RectifyImpl.Glyph.mapSomeT(this.rg, props.mapping, RectifyImpl.Glyph.listAll);
        return this.cache(props, ret);
    }

    public gsubAlternate(props: Ot.Gsub.MultipleAlternateProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;

        const ret = new Ot.Gsub.Alternate();
        this.setMeta(props, ret);
        ret.mapping = RectifyImpl.Glyph.mapSomeT(this.rg, props.mapping, RectifyImpl.Glyph.listAll);
        return this.cache(props, ret);
    }

    public gsubLigature(props: Ot.Gsub.LigatureProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gsub.Ligature();
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
        return this.cache(props, ret);
    }

    public gsubReverse(props: Ot.Gsub.ReverseSubProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gsub.ReverseSub();
        this.setMeta(props, ret);
        ret.rules = RectifyImpl.listSomeT(this.rg, props.rules, (rec, rule) => {
            const match1 = RectifyImpl.listAllT(rec, rule.match, RectifyImpl.Glyph.setAll);
            const replace1 = RectifyImpl.Glyph.bimapSome(rec, rule.replacement);
            if (!match1 || !replace1) return null;
            else return { ...rule, match: match1, replacement: replace1 };
        });
        return this.cache(props, ret);
    }

    public gposSingle(props: Ot.Gpos.SingleProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.Single();
        this.setMeta(props, ret);
        ret.adjustments = RectifyImpl.Glyph.mapSomeT(this.rg, props.adjustments, (rec, x) =>
            rectifyAdjustment(this.rc, x)
        );
        return this.cache(props, ret);
    }

    public gposPair(props: Ot.Gpos.PairProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.Pair();
        this.setMeta(props, ret);
        const cdFirst = props.adjustments.getXClassDef();
        const cdSecond = props.adjustments.getYClassDef();
        for (let c1 = 0; c1 < cdFirst.length; c1++) {
            for (let c2 = 0; c2 < cdSecond.length; c2++) {
                const adj = props.adjustments.getByClass(c1, c2);
                if (adj == null) continue;
                const cFirst1 = RectifyImpl.Glyph.listSome(this.rg, cdFirst[c1]);
                const cSecond1 = RectifyImpl.Glyph.listSome(this.rg, cdSecond[c2]);
                if (cFirst1 && cFirst1.length && cSecond1 && cSecond1.length) {
                    ret.adjustments.set(new Set(cFirst1), new Set(cSecond1), [
                        rectifyAdjustment(this.rc, adj[0]),
                        rectifyAdjustment(this.rc, adj[1])
                    ]);
                }
            }
        }
        return this.cache(props, ret);
    }

    public gposCursive(props: Ot.Gpos.CursiveProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.Cursive();
        this.setMeta(props, ret);
        ret.attachments = RectifyImpl.mapSome2T(
            this.rg,
            props.attachments,
            (rg, g) => rg.glyph(g),
            (rg, g, x) => rectifyAnchorPairAP(this.rap, g, rectifyAnchorPair(this.rc, x))
        );
        return this.cache(props, ret);
    }

    public gposMarkToBase(props: Ot.Gpos.MarkToBaseProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.MarkToBase();
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
        return this.cache(props, ret);
    }

    public gposMarkToMark(props: Ot.Gpos.MarkToMarkProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.MarkToMark();
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
        return this.cache(props, ret);
    }

    public gposMarkToLigature(props: Ot.Gpos.MarkToLigatureProp): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) {
            return g;
        }
        const ret = new Ot.Gpos.MarkToLigature();
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
            (rg, g, x) => rectifyLigatureRecordAP(this.rap, g, rectifyLigatureRecord(this.rc, x))
        );
        return this.cache(props, ret);
    }

    public gsubChaining(props: Ot.GsubGpos.ChainingProp<Ot.GsubGpos.Lookup>): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gsub.Chaining();
        this.setMeta(props, ret);
        this.processChainingRules(props, ret);
        return this.cache(props, ret);
    }
    public gposChaining(props: Ot.GsubGpos.ChainingProp<Ot.GsubGpos.Lookup>): Ot.GsubGpos.Lookup {
        const g = this._cache.get(props);
        if (g) return g;
        const ret = new Ot.Gpos.Chaining();
        this.setMeta(props, ret);
        this.processChainingRules(props, ret);
        return this.cache(props, ret);
    }
    private processChainingRules(
        props: Ot.GsubGpos.ChainingProp<Ot.GsubGpos.Lookup>,
        ret: Ot.GsubGpos.ChainingLookup
    ) {
        ret.rules = RectifyImpl.listSomeT(this.rg, props.rules, (rec, rule) => {
            const match1 = RectifyImpl.listAllT(rec, rule.match, RectifyImpl.Glyph.setAll);
            if (!match1 || !match1.length) return null;
            const applications1: Ot.GsubGpos.ChainingApplication[] = [];
            for (const app of rule.applications) {
                if (!app.lookup.acceptLookupAlgebra(this.removable)) {
                    applications1.push(app);
                }
            }
            if (!applications1.length) return null;
            return {
                match: match1,
                applications: applications1,
                inputBegins: rule.inputBegins,
                inputEnds: rule.inputEnds
            };
        });
    }
}

// Helper functions

function rectifyAdjustment(rec: Rectify.Coord.RectifierT<Ot.Var.Value>, adj: Ot.Gpos.Adjustment) {
    return {
        ...adj,
        dX: rec.coord(adj.dX),
        dY: rec.coord(adj.dY),
        dWidth: rec.coord(adj.dWidth),
        dHeight: rec.coord(adj.dHeight)
    };
}
function rectifyAnchor(rec: Rectify.Coord.RectifierT<Ot.Var.Value>, anc: Ot.Gpos.Anchor) {
    return { ...anc, x: rec.coord(anc.x), y: rec.coord(anc.y) };
}
function rectifyAnchorAP(
    rectifier: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>,
    context: Ot.Glyph,
    z: Ot.Gpos.Anchor
) {
    if (!rectifier || !z.attachToPoint) return z;
    const desired = rectifier.getGlyphPoint(context, z.attachToPoint.pointIndex);
    if (!desired) return { ...z, attachToPoint: null };
    const accept = rectifier.acceptOffset(desired, z);
    if (accept.x && accept.y) return z;
    switch (rectifier.manner) {
        case Rectify.PointAttach.Manner.TrustAttachment:
            return { ...z, x: desired.x, y: desired.y };
        case Rectify.PointAttach.Manner.TrustCoordinate:
            return { ...z, attachToPoint: null };
    }
}
function rectifyAnchorPair(
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>,
    ap: Ot.Gpos.CursiveAnchorPair
) {
    return {
        entry: !ap.entry ? ap.entry : rectifyAnchor(rec, ap.entry),
        exit: !ap.exit ? ap.exit : rectifyAnchor(rec, ap.exit)
    };
}
function rectifyAnchorPairAP(
    rectifier: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>,
    context: Ot.Glyph,
    ap: Ot.Gpos.CursiveAnchorPair
) {
    return {
        entry: !ap.entry ? ap.entry : rectifyAnchorAP(rectifier, context, ap.entry),
        exit: !ap.exit ? ap.exit : rectifyAnchorAP(rectifier, context, ap.exit)
    };
}
function rectifyMarkRecord(rec: Rectify.Coord.RectifierT<Ot.Var.Value>, mr: Ot.Gpos.MarkRecord) {
    const mr1: Ot.Gpos.MarkRecord = { markAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.markAnchors.length; clsAnchor++) {
        const a = mr.markAnchors[clsAnchor];
        if (!a) mr1.markAnchors[clsAnchor] = a;
        else mr1.markAnchors[clsAnchor] = rectifyAnchor(rec, a);
    }
    return mr1;
}
function rectifyMarkRecordAP(
    rec: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>,
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
function rectifyBaseRecord(rec: Rectify.Coord.RectifierT<Ot.Var.Value>, mr: Ot.Gpos.BaseRecord) {
    const mr1: Ot.Gpos.BaseRecord = { baseAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
        const a = mr.baseAnchors[clsAnchor];
        if (!a) mr1.baseAnchors[clsAnchor] = a;
        else mr1.baseAnchors[clsAnchor] = rectifyAnchor(rec, a);
    }
    return mr1;
}
function rectifyBaseRecordAP(
    rec: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>,
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
function rectifyLigatureRecord(
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>,
    mr: Ot.Gpos.LigatureRecord
) {
    const mr1: Ot.Gpos.LigatureRecord = { baseAnchors: [] };
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
function rectifyLigatureRecordAP<G, X>(
    rec: Data.Maybe<Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>>,
    glyph: Ot.Glyph,
    mr: Ot.Gpos.LigatureRecord
) {
    const mr1: Ot.Gpos.LigatureRecord = { baseAnchors: [] };
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
