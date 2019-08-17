import { Int16, UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace MetricHead {
    export const TagHhea = "hhea";
    export const TagVhea = "vhea";

    export abstract class Table implements OtVar.Rectifiable {
        public abstract readonly isVertical: boolean;
        public majorVersion: UInt16 = 1;
        public minorVersion: UInt16 = 0;
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
        public metricDataFormat: Int16 = 0;
        public numberOfLongMetrics: UInt16 = 0;

        public rectifyCoords(rectify: OtVar.Rectifier) {
            this.ascender = rectify.coord(this.ascender);
            this.descender = rectify.coord(this.descender);
            this.lineGap = rectify.coord(this.lineGap);
            this.caretSlopeRise = rectify.coord(this.caretSlopeRise);
            this.caretSlopeRun = rectify.coord(this.caretSlopeRun);
            this.caretOffset = rectify.coord(this.caretOffset);
        }
    }
    export class Hhea extends Table {
        public readonly isVertical = false;
    }
    export class Vhea extends Table {
        public readonly isVertical = true;
    }
}
