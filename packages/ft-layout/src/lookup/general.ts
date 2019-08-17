import { Data } from "@ot-builder/prelude";
import { Rectify, Trace } from "@ot-builder/rectify";

/** General lookup type */
export interface GeneralLookupT<G, X, L>
    extends Trace.Glyph.TraceableT<G>,
        Rectify.Glyph.RectifiableT<G>,
        Rectify.Coord.RectifiableT<X>,
        Rectify.Lookup.RectifiableT<L>,
        Rectify.Elim.Eliminable {
    rightToLeft: boolean;
    ignoreGlyphs: Data.Maybe<Set<G>>;
}
