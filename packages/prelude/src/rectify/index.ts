// RECTIFICATION INTERFACES
export namespace Rectify {
    ////// "GLYPH" rectifier (VERY frequently used)
    export namespace Glyph {
        export interface RectifierT<G> {
            glyph(from: G): null | undefined | G;
        }
        export interface RectifiableT<G> {
            rectifyGlyphs(rectifier: RectifierT<G>): void | boolean;
        }
    }

    ////// "Axis" rectifier
    export namespace Axis {
        export interface RectifierT<A> {
            axis(axis: A): null | undefined | A;
            readonly addedAxes: ReadonlyArray<A>;
        }
        export interface RectifiableT<A> {
            rectifyAxes(rectifier: RectifierT<A>): void;
        }
    }

    ////// "Coord" rectifier
    export namespace Coord {
        export interface RectifierT<X> {
            coord(value: X): X;
            cv(value: X): X;
        }
        export interface RectifiableT<X> {
            rectifyCoords(rectifier: RectifierT<X>): void;
        }
    }

    ////// "Lookup" rectifier
    export namespace Lookup {
        export interface RectifierT<L> {
            lookup(l: L): null | undefined | L;
        }
        export interface RectifiableT<L> {
            rectifyLookups(rectifier: RectifierT<L>): void;
        }
    }

    ////// "Elim" rectifier
    export namespace Elim {
        export interface Eliminable {
            cleanupEliminable(): boolean;
        }
    }
}

// TRACING INTERFACES
export namespace Trace {
    export namespace Glyph {
        export interface TracerT<G> {
            has(glyph: G): boolean;
            add(glyph: G): void;
        }
        export interface TraceableT<G> {
            traceGlyphs(marker: TracerT<G>): void;
        }
    }
}
