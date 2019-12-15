import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

export namespace GdefSubParts {
    export type AttachPointsT<G> = Array<OtGlyph.PointIDRef>;
    export type AttachPointListT<G> = Map<G, AttachPointsT<G>>;

    export interface LigCaretT<X> {
        readonly x: X;
        readonly pointAttachment?: Data.Maybe<OtGlyph.PointIDRef>;
        readonly xDevice?: Data.Maybe<ReadonlyArray<number>>;
    }
    export type LigCaretListT<G, X> = Map<G, Array<LigCaretT<X>>>;
}
