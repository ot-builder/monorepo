import { RectifyImpl } from "@ot-builder/common-impl";
import { Data, Rectify, Trace } from "@ot-builder/prelude";

import { LayoutCommon } from "../common";

import { GeneralLookupT } from "./general";

export interface GposMarkRecordT<X> {
    // Why array? because we may have multiple subtables defining multiple mark classes
    // and corresponded anchors for one mark glyph, used on different bases.
    markAnchors: Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>;
}
export interface GposBaseRecordT<X> {
    baseAnchors: Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>;
}
export interface GposLigatureRecordT<X> {
    baseAnchors: Array<Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>>;
}

function rectifyMarkRecord<X>(rec: Rectify.Coord.RectifierT<X>, mr: GposMarkRecordT<X>) {
    const mr1: GposMarkRecordT<X> = { markAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.markAnchors.length; clsAnchor++) {
        const a = mr.markAnchors[clsAnchor];
        if (!a) mr1.markAnchors[clsAnchor] = a;
        else mr1.markAnchors[clsAnchor] = LayoutCommon.Anchor.rectify(rec, a);
    }
    return mr1;
}
function rectifyPointAttachMarkRecord<G, X>(
    rec: Rectify.PointAttach.RectifierT<G, X>,
    glyph: G,
    mr: GposMarkRecordT<X>
) {
    const mr1: GposMarkRecordT<X> = { markAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.markAnchors.length; clsAnchor++) {
        const a = mr.markAnchors[clsAnchor];
        if (!a) mr1.markAnchors[clsAnchor] = a;
        else {
            mr1.markAnchors[clsAnchor] = LayoutCommon.Anchor.rectifyPointAttachment(rec, glyph, a);
        }
    }
    return mr1;
}
function rectifyBaseRecord<X>(rec: Rectify.Coord.RectifierT<X>, mr: GposBaseRecordT<X>) {
    const mr1: GposBaseRecordT<X> = { baseAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
        const a = mr.baseAnchors[clsAnchor];
        if (!a) mr1.baseAnchors[clsAnchor] = a;
        else mr1.baseAnchors[clsAnchor] = LayoutCommon.Anchor.rectify(rec, a);
    }
    return mr1;
}
function rectifyPointAttachBaseRecord<G, X>(
    rec: Rectify.PointAttach.RectifierT<G, X>,
    glyph: G,
    mr: GposBaseRecordT<X>
) {
    const mr1: GposBaseRecordT<X> = { baseAnchors: [] };
    for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
        const a = mr.baseAnchors[clsAnchor];
        if (!a) mr1.baseAnchors[clsAnchor] = a;
        else {
            mr1.baseAnchors[clsAnchor] = LayoutCommon.Anchor.rectifyPointAttachment(rec, glyph, a);
        }
    }
    return mr1;
}
function rectifyLigatureRecord<X>(rec: Rectify.Coord.RectifierT<X>, mr: GposLigatureRecordT<X>) {
    const mr1: GposLigatureRecordT<X> = { baseAnchors: [] };
    for (let part = 0; part < mr.baseAnchors.length; part++) {
        mr1.baseAnchors[part] = [];
        for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
            const a = mr.baseAnchors[part][clsAnchor];
            if (!a) mr1.baseAnchors[part][clsAnchor] = a;
            else mr1.baseAnchors[part][clsAnchor] = LayoutCommon.Anchor.rectify(rec, a);
        }
    }
    return mr1;
}
function rectifyPointAttachLigatureRecord<G, X>(
    rec: Rectify.PointAttach.RectifierT<G, X>,
    glyph: G,
    mr: GposLigatureRecordT<X>
) {
    const mr1: GposLigatureRecordT<X> = { baseAnchors: [] };
    for (let part = 0; part < mr.baseAnchors.length; part++) {
        mr1.baseAnchors[part] = [];
        for (let clsAnchor = 0; clsAnchor < mr.baseAnchors.length; clsAnchor++) {
            const a = mr.baseAnchors[part][clsAnchor];
            if (!a) mr1.baseAnchors[part][clsAnchor] = a;
            else {
                mr1.baseAnchors[part][clsAnchor] = LayoutCommon.Anchor.rectifyPointAttachment(
                    rec,
                    glyph,
                    a
                );
            }
        }
    }
    return mr1;
}

export class GposMarkLookupBaseT<G, X, L> {
    public marks = new Map<G, GposMarkRecordT<X>>();
    public rectifyLookups(rec: Rectify.Lookup.RectifierT<L>) {}
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {}
}
export class GposMarkToBaseLookupT<G, X, L> extends GposMarkLookupBaseT<G, X, L>
    implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public bases = new Map<G, GposBaseRecordT<X>>();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.marks = RectifyImpl.Glyph.mapSome(rec, this.marks);
        this.bases = RectifyImpl.Glyph.mapSome(rec, this.bases);
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
        this.marks = RectifyImpl.mapSomeT(rec, this.marks, (r, g) => g, rectifyMarkRecord);
        this.bases = RectifyImpl.mapSomeT(rec, this.bases, (r, g) => g, rectifyBaseRecord);
    }
    public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
        this.marks = RectifyImpl.mapSome2T(
            rec,
            this.marks,
            RectifyImpl.Id,
            rectifyPointAttachMarkRecord
        );
        this.bases = RectifyImpl.mapSome2T(
            rec,
            this.bases,
            RectifyImpl.Id,
            rectifyPointAttachBaseRecord
        );
    }
    public cleanupEliminable() {
        return !this.marks.size || !this.bases.size;
    }
}
export class GposMarkToMarkLookupT<G, X, L> extends GposMarkLookupBaseT<G, X, L>
    implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public baseMarks = new Map<G, GposBaseRecordT<X>>();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.marks = RectifyImpl.Glyph.mapSome(rec, this.marks);
        this.baseMarks = RectifyImpl.Glyph.mapSome(rec, this.baseMarks);
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
        this.marks = RectifyImpl.mapSomeT(rec, this.marks, (r, g) => g, rectifyMarkRecord);
        this.baseMarks = RectifyImpl.mapSomeT(rec, this.baseMarks, (r, g) => g, rectifyBaseRecord);
    }
    public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
        this.marks = RectifyImpl.mapSome2T(
            rec,
            this.marks,
            RectifyImpl.Id,
            rectifyPointAttachMarkRecord
        );
        this.baseMarks = RectifyImpl.mapSome2T(
            rec,
            this.baseMarks,
            RectifyImpl.Id,
            rectifyPointAttachBaseRecord
        );
    }
    public cleanupEliminable() {
        return !this.marks.size || !this.baseMarks.size;
    }
}
export class GposMarkToLigatureLookupT<G, X, L> extends GposMarkLookupBaseT<G, X, L>
    implements GeneralLookupT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public bases = new Map<G, GposLigatureRecordT<X>>();

    public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
        this.ignoreGlyphs = RectifyImpl.Glyph.setSome(rec, this.ignoreGlyphs);
        this.marks = RectifyImpl.Glyph.mapSome(rec, this.marks);
        this.bases = RectifyImpl.Glyph.mapSome(rec, this.bases);
    }
    public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
        this.marks = RectifyImpl.mapSomeT(rec, this.marks, (r, g) => g, rectifyMarkRecord);
        this.bases = RectifyImpl.mapSomeT(rec, this.bases, (r, g) => g, rectifyLigatureRecord);
    }
    public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
        this.marks = RectifyImpl.mapSome2T(
            rec,
            this.marks,
            RectifyImpl.Id,
            rectifyPointAttachMarkRecord
        );
        this.bases = RectifyImpl.mapSome2T(
            rec,
            this.bases,
            RectifyImpl.Id,
            rectifyPointAttachLigatureRecord
        );
    }
    public cleanupEliminable() {
        return !this.marks.size || !this.bases.size;
    }
}
