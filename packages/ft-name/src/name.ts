import { Data } from "@ot-builder/prelude";

export namespace Name {
    export const Tag = "name";
    export type Record = {
        readonly platformID: number;
        readonly encodingID: number;
        readonly languageID: number;
        readonly nameID: number;
        readonly value: string | Buffer;
    };
    export class Table {
        public records: Record[] = [];
        public langTagMap: Data.Maybe<string[]> = null;
    }
}
