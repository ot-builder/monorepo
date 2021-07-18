import { Data } from "@ot-builder/prelude";

import * as LayoutCommon from "../common";

import * as GdefSubParts from "./sub-parts";

export type Coverage<G> = LayoutCommon.Coverage.T<G>;
export type ClassDef<G> = LayoutCommon.ClassDef.T<G>;
export type AttachPointsT<G> = GdefSubParts.AttachPointsT<G>;
export type AttachPointListT<G> = GdefSubParts.AttachPointListT<G>;
export type LigCaretT<X> = GdefSubParts.LigCaretT<X>;
export type LigCaretListT<G, X> = GdefSubParts.LigCaretListT<G, X>;

export class TableT<G, X> {
    public glyphClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>> = null;
    public attachList: Data.Maybe<GdefSubParts.AttachPointListT<G>> = null;
    public ligCarets: Data.Maybe<GdefSubParts.LigCaretListT<G, X>> = null;
    public markAttachClassDef: Data.Maybe<LayoutCommon.ClassDef.T<G>> = null;
    public markGlyphSets: Data.Maybe<Array<LayoutCommon.Coverage.T<G>>> = null;
}
