import { Int16, UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace MetricHead {
    export const TagHhea = "hhea";
    export const TagVhea = "vhea";

    export abstract class Table {
        public abstract readonly isVertical: boolean;
        public abstract readonly majorVersion: UInt16;
        public abstract readonly minorVersion: UInt16;
        public ascender: OtVar.Value = 0;
        public descender: OtVar.Value = 0;
        public lineGap: OtVar.Value = 0;
        public advanceMax: UInt16 = 0;
        public minStartSideBearing: Int16 = 0;
        public minEndSideBearing: Int16 = 0;
        public maxExtent: Int16 = 0;
        public caretSlopeRise: OtVar.Value = 0;
        public caretSlopeRun: OtVar.Value = 0;
        public caretOffset: OtVar.Value = 0;
        public _reserved0: Int16 = 0;
        public _reserved1: Int16 = 0;
        public _reserved2: Int16 = 0;
        public _reserved3: Int16 = 0;
        public readonly metricDataFormat: Int16 = 0;
        public numberOfLongMetrics: UInt16 = 0;
    }
    export class Hhea extends Table {
        public readonly isVertical = false;
        constructor(
            public readonly majorVersion: number = 1,
            public readonly minorVersion: number = 0
        ) {
            super();
        }
    }
    export class Vhea extends Table {
        public readonly isVertical = true;
        constructor(
            public readonly majorVersion: number = 1,
            public readonly minorVersion: number = 0
        ) {
            super();
        }
    }
}
