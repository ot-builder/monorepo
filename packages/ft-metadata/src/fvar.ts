import { F16D16, Tag, UInt16 } from "@ot-builder/primitive";
import { Rectify } from "@ot-builder/rectify";
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

    export class Table implements Rectify.Axis.RectifiableT<Axis> {
        public axes: Axis[] = [];
        public instances: Instance[] = [];

        // Rectification
        public rectifyAxes(rectify: Rectify.Axis.RectifierT<Axis>) {
            const axesRectifyResults: Map<Axis, Axis> = this.rectifyAxesImpl(rectify);
            this.rectifyInstances(axesRectifyResults, rectify.addedAxes);
        }

        private rectifyAxesImpl(rectify: Rectify.Axis.RectifierT<Axis>) {
            const axesRectifyResults: Map<Axis, Axis> = new Map();
            for (const a of this.axes) {
                const a1 = rectify.axis(a);
                if (a1) axesRectifyResults.set(a, a1);
            }
            this.axes = [...axesRectifyResults.values(), ...rectify.addedAxes];
            return axesRectifyResults;
        }

        private rectifyInstances(
            axesRectifyResults: Map<Axis, Axis>,
            addedAxes: ReadonlyArray<Axis>
        ) {
            const newInstances: Instance[] = [];
            for (const instance of this.instances) {
                const coordinates = instance.coordinates;
                const coordinates1 = this.rectifyCoordinates(
                    coordinates,
                    axesRectifyResults,
                    addedAxes
                );
                newInstances.push(
                    new Instance(
                        instance.subfamilyNameID,
                        instance.flags,
                        coordinates1,
                        instance.postScriptNameID
                    )
                );
            }
            this.instances = newInstances;
        }

        private rectifyCoordinates(
            coordinates: GeneralVar.Instance<Axis>,
            axesRectifyResults: Map<Axis, Axis>,
            addedAxes: ReadonlyArray<Axis>
        ) {
            if (!coordinates) return coordinates;

            const coordinates1: Map<Axis, number> = new Map();
            for (let [axis, val] of coordinates) {
                const mapped = axesRectifyResults.get(axis);
                if (mapped) coordinates1.set(axis, val);
            }
            for (const axis of addedAxes) coordinates1.set(axis, 0);
            return coordinates1;
        }
    }
}
