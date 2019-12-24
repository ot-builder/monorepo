import { ImpLib } from "@ot-builder/common-impl";
import { UInt16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace Fvar {
    export const Tag = "fvar";

    export enum AxisFlags {
        Default = 0,
        Hidden = 1
    }

    export class Axis {
        constructor(
            public readonly dim: OtVar.Dim,
            public readonly flags: AxisFlags,
            public readonly axisNameID: UInt16
        ) {}
    }

    export enum InstanceFlags {
        Default = 0
    }

    export class Instance {
        constructor(
            public readonly subfamilyNameID: number,
            public readonly flags: InstanceFlags,
            public readonly coordinates: OtVar.Instance,
            public readonly postScriptNameID?: number
        ) {}
    }

    export class Table {
        constructor(public axes: Axis[] = [], public instances: Instance[] = []) {}
        public getDesignSpace() {
            return ImpLib.Order.fromList(
                "DesignSpace",
                this.axes.map(a => a.dim)
            );
        }
    }
}
