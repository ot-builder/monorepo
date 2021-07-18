export interface Source<G> {
    getName(item: G): undefined | null | string;
}
export interface IndexSource<G> {
    getIndex(item: G): undefined | null | number;
    getVariantIndex(item: G): undefined | null | number[];
}
