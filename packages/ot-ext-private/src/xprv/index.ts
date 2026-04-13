// XPRV: Extensible Private Data
import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { Data } from "@ot-builder/prelude";

export const Tag = "XPRV";
export type Blob = Map<string, Buffer>;
export class Table {
    public shared: Data.Maybe<Blob> = null;
    public perGlyph: Data.Maybe<Map<OtGlyph, Blob>> = null;
}
