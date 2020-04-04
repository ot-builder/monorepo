import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { EncodingMapT } from "./encoding-map-impl";
import { VsEncodingMapT } from "./vs-encoding-map-impl";

export { VsEncodingMapT as CmapGeneralVsEncodingMapT } from "./vs-encoding-map-impl";

export namespace Cmap {
    export const Tag = "cmap";

    export class EncodingMap extends EncodingMapT<OtGlyph> {}
    export class VsEncodingMap extends VsEncodingMapT<OtGlyph> {}

    export class Table {
        public unicode = new EncodingMap();
        public vs = new VsEncodingMap();
    }
}

export interface OtEncoding {
    cmap?: Data.Maybe<Cmap.Table>;
}
