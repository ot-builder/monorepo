import { Data } from "@ot-builder/prelude";
import { Rectify } from "@ot-builder/rectify";
import { GeneralVar } from "@ot-builder/variance";

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
    export type WT<X> = Data.Writable<T<X>>;

    export type PairT<X> = [T<X>, T<X>];
    export type PairWT<X> = [WT<X>, WT<X>];

    // lens functions
    export function dXOf<X>(adj: T<X>): Data.Lens<T<X>, VT<X>> {
        return {
            get: s => ({ value: s.dX, device: s.dXDevice }),
            set: (s, t) => ({ ...s, dX: t.value, dXDevice: t.device })
        };
    }
    export function dYOf<X>(adj: T<X>): Data.Lens<T<X>, VT<X>> {
        return {
            get: s => ({ value: s.dY, device: s.dYDevice }),
            set: (s, t) => ({ ...s, dY: t.value, dYDevice: t.device })
        };
    }
    export function dWidthOf<X>(adj: T<X>): Data.Lens<T<X>, VT<X>> {
        return {
            get: s => ({ value: s.dWidth, device: s.dWidthDevice }),
            set: (s, t) => ({ ...s, dWidth: t.value, dWidthDevice: t.device })
        };
    }
    export function dHeightOf<X>(adj: T<X>): Data.Lens<T<X>, VT<X>> {
        return {
            get: s => ({ value: s.dHeight, device: s.dHeightDevice }),
            set: (s, t) => ({ ...s, dHeight: t.value, dHeightDevice: t.device })
        };
    }

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
