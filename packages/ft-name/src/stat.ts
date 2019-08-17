import { Data } from "@ot-builder/prelude";
import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";

export namespace Stat {
    export const Tag = `STAT`;

    export class Axis {
        constructor(
            public readonly tag: Tag,
            public readonly axisNameID: UInt16,
            public readonly axisOrdering: UInt16
        ) {}
    }

    export class NameAssignment {
        constructor(public flags: UInt16, public valueNameID: UInt16) {}
    }

    export namespace AxisValue {
        export abstract class General {}
        export class Static extends General {
            constructor(public axis: Axis, public readonly value: F16D16) {
                super();
            }
        }
        export class Linked extends General {
            constructor(public axis: Axis, public value: F16D16, public linkedValue: F16D16) {
                super();
            }
        }
        export class Variable extends General {
            constructor(
                public axis: Axis,
                public min: F16D16,
                public nominal: F16D16,
                public max: F16D16
            ) {
                super();
            }
        }
        export class PolyAxis extends General {
            constructor(public assignments: [Axis, F16D16][]) {
                super();
            }
        }
    }

    export class Table {
        constructor(
            public designAxes: Axis[] = [],
            // TODO: make a value-based map?
            public assignments: Array<[AxisValue.General, NameAssignment]> = [],
            public elidedFallbackNameID: UInt16 = 0xffff
        ) {}
    }
}
