import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";
import { GeneralVar, OtVar } from "@ot-builder/variance";
export namespace Fvar {
    export const Tag = "fvar";

    export enum AxisFlags {
        Hidden = 1
    }

    export class Axis implements OtVar.Axis {
        public tag: Tag;
        public min: F16D16;
        public default: F16D16;
        public max: F16D16;
        constructor(
            tag: Tag,
            min: F16D16,
            defaultV: F16D16,
            max: F16D16,
            public flags: AxisFlags,
            public axisNameID: UInt16
        ) {
            this.tag = tag;
            this.min = min;
            this.default = defaultV;
            this.max = max;
        }
    }

    export enum InstanceFlags {}

    export class Instance {
        constructor(
            public subfamilyNameID: number,
            public flags: InstanceFlags = 0,
            public coordinates: GeneralVar.Instance<Axis>,
            public postScriptNameID?: number
        ) {}
    }

    export class Table {
        constructor(public axes: Axis[] = [], public instances: Instance[] = []) {}
    }
}
