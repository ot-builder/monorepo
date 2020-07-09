// XPRV: Extensible Private Data
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

export namespace XPrv {
    export const Tag = "XPRV";
    export type Blob = Map<string, Buffer>;
    export class Table {
        public shared: Data.Maybe<Blob> = null;
        public perGlyph: Data.Maybe<Map<OtGlyph, Blob>> = null;
    }
}
