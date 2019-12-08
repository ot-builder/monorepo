// RECTIFICATION INTERFACES
export namespace Rectify {
    ////// "GLYPH" rectifier (VERY frequently used)
    export namespace Glyph {
        export interface RectifierT<G> {
            glyph(from: G): null | undefined | G;
        }
    }

    ////// "Axis" rectifier
    export namespace Axis {
        export interface RectifierT<A> {
            axis(axis: A): null | undefined | A;
            readonly addedAxes: ReadonlyArray<A>;
        }
    }

    ////// "Coord" rectifier
    export namespace Coord {
        export interface RectifierT<X> {
            coord(value: X): X;
            cv(value: X): X;
        }
    }

    ////// "Lookup" rectifier
    export namespace Lookup {
        export interface RectifierT<L> {
            lookup(l: L): null | undefined | L;
        }
    }

    ////// "Elim" rectifier
    export namespace Elim {
        export interface Eliminable {
            cleanupEliminable(): boolean;
        }
    }

    ////// "Point Attachment" rectifier
    export namespace PointAttach {
        export type XYT<X> = { readonly x?: X; readonly y?: X };
        export type XYFT<X> = { readonly x: X; readonly y: X };
        export enum Manner {
            TrustAttachment,
            TrustCoordinate
        }
        export interface RectifierT<G, X> {
            readonly manner: Manner;
            getGlyphPoint(outerGlyph: G, outerID: number): null | XYFT<X>;
            acceptOffset(actual: XYT<X>, desired: XYT<X>): { x: boolean; y: boolean };
        }
        export interface TerminalT<G, X> {
            rectifyPointAttachment(rectifier: RectifierT<G, X>, context: G): void;
        }
        export interface NonTerminalT<G, X> {
            rectifyPointAttachment(rectifier: RectifierT<G, X>): void;
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
        export type ProcT<G> = (tracer: TracerT<G>) => void;
    }
}
