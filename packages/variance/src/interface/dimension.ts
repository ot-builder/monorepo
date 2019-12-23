import { Tag } from "@ot-builder/primitive";

export interface VarianceDim {
    readonly tag: Tag;
    readonly min: number;
    readonly default: number;
    readonly max: number;
}

export interface VarianceDimMapper<T extends VarianceDim> {
    (from: VarianceDim): T;
}
