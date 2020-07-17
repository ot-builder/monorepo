import { Tag } from "@ot-builder/primitive";

export class VarianceDim {
    public readonly tag: Tag;
    public readonly min: number;
    public readonly default: number;
    public readonly max: number;

    // This property is added to prevent literals being recognized as Dim
    protected readonly __dimensionType = 1;

    constructor(tag: Tag, min: number, defaultVal: number, max: number) {
        this.tag = tag;
        this.min = min;
        this.default = defaultVal;
        this.max = max;
    }
}
