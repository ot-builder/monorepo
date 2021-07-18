import { Data } from "@ot-builder/prelude";
import { Int16 } from "@ot-builder/primitive";

export const Tag = "VORG";
export class Table {
    public defaultVertOriginY: Int16 = 0;
    public vertOriginYMetrics: Array<Data.Maybe<Int16>> = [];
    public get(id: number) {
        if (this.vertOriginYMetrics[id] != null) {
            return this.vertOriginYMetrics[id]!;
        } else {
            return this.defaultVertOriginY;
        }
    }
}
