import { Fvar } from "@ot-builder/ot-metadata";

export type FvarReadContext = {
    mapAxis?(raw: Fvar.Axis, index: number): Fvar.Axis;
};
