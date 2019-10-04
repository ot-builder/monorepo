import { Data, Rectify, Trace } from "@ot-builder/prelude";

import { EncodingMapImplT } from "./encoding-map-impl";
import { VsEncodingMapImplT } from "./vs-encoding-map-impl";

export interface EncodingMapT<G> extends Rectify.Glyph.RectifiableT<G>, Trace.Glyph.TraceableT<G> {
    readonly size: number;
    get(code: number): Data.Maybe<G>;
    set(code: number, glyph: G): void;
    delete(code: number): void;
    entries(): Iterable<[number, G]>;
}

export interface VsEncodingMapT<G>
    extends Rectify.Glyph.RectifiableT<G>,
        Trace.Glyph.TraceableT<G> {
    readonly size: number;
    get(code: number, vs: number): Data.Maybe<G>;
    set(code: number, vs: number, glyph: G): void;
    delete(code: number, vs: number): void;
    entries(): Iterable<[number, number, G]>;
}

export class CharacterMapT<G> implements Rectify.Glyph.RectifiableT<G>, Trace.Glyph.TraceableT<G> {
    public unicode: EncodingMapT<G> = new EncodingMapImplT<G>();
    public vs: VsEncodingMapT<G> = new VsEncodingMapImplT<G>();
    public rectifyGlyphs(rectify: Rectify.Glyph.RectifierT<G>) {
        this.unicode.rectifyGlyphs(rectify);
        this.vs.rectifyGlyphs(rectify);
    }
    public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
        this.unicode.traceGlyphs(tracer);
        this.vs.traceGlyphs(tracer);
    }
}
