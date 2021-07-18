export type PointIDRef = {
    readonly pointIndex: number;
};
export type GlyphPointIDRef<G> = {
    readonly glyph: G;
    readonly pointIndex: number;
};
export type PointRef = {
    readonly geometry: number;
    readonly contour: number;
    readonly index: number;
};
export type PointRefW = {
    geometry: number;
    contour: number;
    index: number;
};
export namespace PointRef {
    export function compare(a: PointRef, b: PointRef) {
        return a.geometry - b.geometry || a.contour - b.contour || a.index - b.index;
    }
}
export type PointAttachment = {
    readonly inner: PointIDRef;
    readonly outer: PointIDRef;
};
