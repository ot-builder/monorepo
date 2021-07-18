import { Data } from "@ot-builder/prelude";

export interface DeviceDataT<X> {
    variation: X;
    deviceDeltas?: Data.Maybe<ReadonlyArray<number>>;
}

export interface T<X> {
    readonly dX: X;
    readonly dXDevice?: Data.Maybe<ReadonlyArray<number>>;
    readonly dY: X;
    readonly dYDevice?: Data.Maybe<ReadonlyArray<number>>;
    readonly dWidth: X;
    readonly dWidthDevice?: Data.Maybe<ReadonlyArray<number>>;
    readonly dHeight: X;
    readonly dHeightDevice?: Data.Maybe<ReadonlyArray<number>>;
}
export interface WT<X> {
    dX: X;
    dXDevice?: Data.Maybe<ReadonlyArray<number>>;
    dY: X;
    dYDevice?: Data.Maybe<ReadonlyArray<number>>;
    dWidth: X;
    dWidthDevice?: Data.Maybe<ReadonlyArray<number>>;
    dHeight: X;
    dHeightDevice?: Data.Maybe<ReadonlyArray<number>>;
}

export type PairT<X> = [T<X>, T<X>];
export type PairWT<X> = [WT<X>, WT<X>];
