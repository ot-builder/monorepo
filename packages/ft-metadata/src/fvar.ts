import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";
import { GeneralVar, OtVar } from "@ot-builder/variance";
export namespace Fvar {
    export const Tag = "fvar";

    export enum AxisFlags {
        Default = 0,
        Hidden = 1
    }

    export class Axis implements OtVar.Axis {
        public readonly tag: Tag;
        public readonly min: F16D16;
        public readonly default: F16D16;
        public readonly max: F16D16;
        constructor(
            tag: Tag,
            min: F16D16,
            defaultV: F16D16,
            max: F16D16,
            public readonly flags: AxisFlags,
            public readonly axisNameID: UInt16
        ) {
            this.tag = tag;
            this.min = min;
            this.default = defaultV;
            this.max = max;
        }
    }

    export enum InstanceFlags {
        Default = 0
    }

    export class Instance {
        constructor(
            public readonly subfamilyNameID: number,
            public readonly flags: InstanceFlags,
            public readonly coordinates: GeneralVar.Instance<Axis>,
            public readonly postScriptNameID?: number
        ) {}
    }

    export class Table {
        constructor(public axes: Axis[] = [], public instances: Instance[] = []) {}
    }
}
