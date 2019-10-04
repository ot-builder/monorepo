import { Data } from "@ot-builder/prelude";
import { Rectify } from "@ot-builder/prelude";

export type DeviceTable = ReadonlyArray<number>;
export type DeviceTableW = Array<number>;

export namespace LayoutAdjustment {
    export interface VT<X> {
        value: X;
        device?: Data.Maybe<DeviceTable>;
    }

    export interface DeviceDataT<X> {
        variation: X;
        deviceDeltas?: Data.Maybe<DeviceTable>;
    }

    export interface T<X> {
        readonly dX: X;
        readonly dXDevice?: Data.Maybe<DeviceTable>;
        readonly dY: X;
        readonly dYDevice?: Data.Maybe<DeviceTable>;
        readonly dWidth: X;
        readonly dWidthDevice?: Data.Maybe<DeviceTable>;
        readonly dHeight: X;
        readonly dHeightDevice?: Data.Maybe<DeviceTable>;
    }
    export interface WT<X> {
        dX: X;
        dXDevice?: Data.Maybe<DeviceTable>;
        dY: X;
        dYDevice?: Data.Maybe<DeviceTable>;
        dWidth: X;
        dWidthDevice?: Data.Maybe<DeviceTable>;
        dHeight: X;
        dHeightDevice?: Data.Maybe<DeviceTable>;
    }

    export type PairT<X> = [T<X>, T<X>];
    export type PairWT<X> = [WT<X>, WT<X>];

    export function rectify<X>(rec: Rectify.Coord.RectifierT<X>, adj: T<X>) {
        return {
            ...adj,
            dX: rec.coord(adj.dX),
            dY: rec.coord(adj.dY),
            dWidth: rec.coord(adj.dWidth),
            dHeight: rec.coord(adj.dHeight)
        };
    }
}
