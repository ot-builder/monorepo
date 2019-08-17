import { Tag } from "@ot-builder/primitive";

export interface VarianceAxis {
    readonly tag: Tag;
    readonly min: number;
    readonly default: number;
    readonly max: number;
}

export interface VarianceAxisMapper<T extends VarianceAxis> {
    (from: VarianceAxis): T;
}
