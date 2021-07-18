import { Data } from "@ot-builder/prelude";

import * as Cmap from "./cmap";

export * as Cmap from "./cmap";
export { VsEncodingMapT as CmapGeneralVsEncodingMapT } from "./cmap/vs-encoding-map-impl";

export interface OtEncoding {
    cmap?: Data.Maybe<Cmap.Table>;
}
