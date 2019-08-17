import { Rectify, Trace } from "@ot-builder/rectify";

import { GeneralLookupT } from "./general";

export type GsubReverseSubstT<G> = Map<G, G>;
export interface GsubReverseRuleT<G, GS> {
    match: Array<GS>;
    doSubAt: number;
    replacement: GsubReverseSubstT<G>;
}

export class GsubReverseSingleSubT<G, X, L> implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: GsubReverseRuleT<G, Set<G>>[] = [];

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = Rectify.Glyph.setSome(rec, this.ignoreGlyphs);

        this.rules = Rectify.listSomeT(rec, this.rules, (rec, rule) => {
            const match1 = Rectify.listAllT(rec, rule.match, Rectify.Glyph.setAll);
            const replace1 = Rectify.Glyph.bimapSome(rec, rule.replacement);
            if (!match1 || !replace1) return null;
            else return { ...rule, match: match1, replacement: replace1 };
        });
    }
    public traceGlyphs(marker: Trace.Glyph.TracerT<G>) {}
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {}
    public cleanupEliminable() {
        return !this.rules.length;
    }
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
}
