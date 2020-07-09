import { Data } from "@ot-builder/prelude";

import { Cmap } from "./cmap";
import { XPrv } from "./xprv";

export { Cmap } from "./cmap";
export { VsEncodingMapT as CmapGeneralVsEncodingMapT } from "./cmap/vs-encoding-map-impl";
export { XPrv } from "./xprv";

export interface OtEncoding {
    cmap?: Data.Maybe<Cmap.Table>;
    xPrv?: Data.Maybe<XPrv.Table>;
}
