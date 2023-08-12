import * as Primitive from "@ot-builder/primitive";

export const Tag = `STAT`;

export class Axis {
    constructor(
        public readonly tag: Primitive.Tag,
        public readonly axisNameID: Primitive.UInt16,
        public readonly axisOrdering: Primitive.UInt16
    ) {}
}

export enum NameFlags {
    OlderSiblingFontAttribute = 1,
    ElidableAxisValueName = 2
}

export class NameAssignment {
    constructor(
        public readonly flags: NameFlags,
        public readonly valueNameID: Primitive.UInt16
    ) {}
}

export namespace AxisValue {
    export abstract class General {}
    export class Static extends General {
        constructor(
            public readonly axis: Axis,
            public readonly value: Primitive.F16D16
        ) {
            super();
        }
    }
    export class Linked extends General {
        constructor(
            public readonly axis: Axis,
            public readonly value: Primitive.F16D16,
            public readonly linkedValue: Primitive.F16D16
        ) {
            super();
        }
    }
    export class Variable extends General {
        constructor(
            public readonly axis: Axis,
            public readonly min: Primitive.F16D16,
            public readonly nominal: Primitive.F16D16,
            public readonly max: Primitive.F16D16
        ) {
            super();
        }
    }
    export class PolyAxis extends General {
        constructor(public readonly assignments: [Axis, Primitive.F16D16][]) {
            super();
        }
    }
}

export class Table {
    constructor(
        public designAxes: Axis[] = [],
        // TODO: make a value-based map?
        public assignments: Array<[AxisValue.General, NameAssignment]> = [],
        public elidedFallbackNameID: Primitive.UInt16 = 0xffff
    ) {}
}
