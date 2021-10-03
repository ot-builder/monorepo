import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export const Tag = "TSIC";

export type Location = Map<OtVar.Dim, number>;
export type Record = {
    name?: Data.Maybe<string>;
    location: Location;
    cvtValues: Map<number, number>;
};
export class Table {
    public records: Record[] = [];
}
