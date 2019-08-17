import { Rectify, Trace } from "@ot-builder/rectify";

import { GeneralLookupT } from "./general";

export interface ChainingApplicationT<L> {
    at: number;
    lookup: L;
}
export interface ChainingRuleT<GS, L> {
    match: Array<GS>;
    inputBegins: number;
    inputEnds: number;
    applications: Array<ChainingApplicationT<L>>;
}

export class ForwardChainingLookupT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, L>[] = [];

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = Rectify.Glyph.setSome(rec, this.ignoreGlyphs);
        this.rules = Rectify.listSomeT(rec, this.rules, (rec, rule) => {
            const match1 = Rectify.listAllT(rec, rule.match, Rectify.Glyph.setAll);
            if (match1 && match1.length) return { ...rule, match: match1 };
            else return null;
        });
    }
    public traceGlyphs(marker: Trace.Glyph.TracerT<G>) {}
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public cleanupEliminable() {
        return !this.rules.length;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {
        this.rules = Rectify.listSomeT(rec, this.rules, (rec, rule) => ({
            ...rule,
            applications: Rectify.listSomeT(rec, rule.applications, (rec, app) => {
                const lookup1 = rec.lookup(app.lookup);
                return lookup1 ? { at: app.at, lookup: lookup1 } : null;
            })
        }));
    }
}
