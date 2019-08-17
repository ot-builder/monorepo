import { Fvar } from "@ot-builder/ft-metadata";

export type FvarReadContext = {
    mapAxis?(raw: Fvar.Axis, index: number): Fvar.Axis;
};
