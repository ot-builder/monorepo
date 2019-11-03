import { RectifyImpl } from "@ot-builder/common-impl";
import { Data, Rectify, Trace } from "@ot-builder/prelude";

import { LayoutCommon } from "../common";

import { GdefSubParts } from "./sub-parts";

export namespace GeneralGdef {
    export type Coverage<G> = LayoutCommon.Coverage.T<G>;
    export type ClassDef<G> = LayoutCommon.ClassDef.T<G>;
    export type AttachPointsT<G> = GdefSubParts.AttachPointsT<G>;
    export type AttachPointListT<G> = GdefSubParts.AttachPointListT<G>;
    export type LigCaretT<X> = GdefSubParts.LigCaretT<X>;
    export type LigCaretListT<G, X> = GdefSubParts.LigCaretListT<G, X>;

    export class TableT<G, X>
        implements
            Rectify.Glyph.RectifiableT<G>,
            Rectify.Coord.RectifiableT<X>,
            Rectify.PointAttach.NonTerminalT<G, X>,
            Trace.Glyph.TraceableT<G> {
        public glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>> = null;
        public attachList: Data.Maybe<GdefSubParts.AttachPointListT<G>> = null;
        public ligCarets: Data.Maybe<GdefSubParts.LigCaretListT<G, X>> = null;
        public markAttachClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>> = null;
        public markGlyphSets: Data.Maybe<Array<LayoutCommon.Coverage.T<G>>> = null;

        // Rectify and Tracing
        public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {}
        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            if (this.ligCarets) {
                this.ligCarets = RectifyImpl.mapSomeT(
                    rec,
                    this.ligCarets,
                    RectifyImpl.Id,
                    GdefSubParts.rectifyLigCaretArrayCoord
                );
            }
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            if (this.glyphClassDef) {
                this.glyphClassDef = RectifyImpl.Glyph.mapSome(rec, this.glyphClassDef);
            }
            if (this.attachList) {
                this.attachList = RectifyImpl.Glyph.mapSome(rec, this.attachList);
            }
            if (this.ligCarets) {
                this.ligCarets = RectifyImpl.Glyph.mapSome(rec, this.ligCarets);
            }
            if (this.markAttachClassDef) {
                this.markAttachClassDef = RectifyImpl.Glyph.mapSome(rec, this.markAttachClassDef);
            }
            if (this.markGlyphSets) {
                this.markGlyphSets = RectifyImpl.listSomeT(
                    rec,
                    this.markGlyphSets,
                    RectifyImpl.Glyph.setSome
                );
            }
        }
        public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
            if (!this.ligCarets) return;
            this.ligCarets = GdefSubParts.rectifyLigCaretListPointAttachment(rec, this.ligCarets);
        }
    }
}
