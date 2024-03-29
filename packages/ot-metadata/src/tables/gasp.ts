import { OtVar } from "@ot-builder/variance";

export const Tag = `gasp`;

export enum RangeBehavior {
    GridFit = 0x0001,
    DoGray = 0x0002,
    SymmetricGridFit = 0x0004,
    SymmetricSmoothing = 0x0008
}

export class Range {
    constructor(
        public maxPPEM: OtVar.Value, // Why?
        public behavior: RangeBehavior
    ) {}
}
export class Table {
    constructor(public ranges: Range[] = []) {}
}
