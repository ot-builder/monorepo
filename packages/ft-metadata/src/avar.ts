import { OtVar } from "@ot-builder/variance";

export namespace Avar {
    export const Tag = "avar";

    export type SegmentMap = [number, number][];

    export class Table implements OtVar.AxesRectifiable {
        public segmentMaps: Map<OtVar.Axis, SegmentMap> = new Map();

        public rectifyAxes(rectify: OtVar.AxisRectifier) {
            let maps1: Map<OtVar.Axis, SegmentMap> = new Map();
            for (const [axis, sgm] of this.segmentMaps) {
                const mappedAxis = rectify.axis(axis);
                if (mappedAxis) maps1.set(mappedAxis, sgm);
            }
            for (const axis of rectify.addedAxes) {
                maps1.set(axis, [[-1, -1], [0, 0], [1, 1]]);
            }
            this.segmentMaps = maps1;
        }
    }
}
