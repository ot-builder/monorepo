import { OtGlyph } from "@ot-builder/ft-glyphs";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";

import { GeneralGdef } from "./general";
import { GdefSubParts } from "./sub-parts";

export namespace Gdef {
    export const Tag = "GDEF";

    export import General = GeneralGdef;

    export type Coverage = LayoutCommon.Coverage.T<OtGlyph>;
    export type ClassDef = LayoutCommon.ClassDef.T<OtGlyph>;

    export type AttachPoints = GdefSubParts.AttachPointsT<OtGlyph>;
    export type AttachPointList = GdefSubParts.AttachPointListT<OtGlyph>;

    export type LigCaret = GdefSubParts.LigCaretT<OtVar.Value>;
    export type LigCaretList = GdefSubParts.LigCaretListT<OtGlyph, OtVar.Value>;

    export enum GlyphClass {
        Base = 1,
        Ligature = 2,
        Mark = 3,
        Component = 4
    }

    // alias
    export class Table extends GeneralGdef.TableT<OtGlyph, OtVar.Value> {}
}
