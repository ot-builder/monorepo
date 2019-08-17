import { Data } from "@ot-builder/prelude";

import { Gdef } from "./gdef";
import { GsubGpos } from "./gsub-gpos";
import { Base } from "./table-base";

export * from "./gsub-gpos";
export * from "./common";
export * from "./gdef";
export * from "./table-base";

//
export * from "./dicing-store";

// Aggregated
export interface OtFontLayoutData {
    gdef?: Data.Maybe<Gdef.Table>;
    gsub?: Data.Maybe<GsubGpos.Table>;
    gpos?: Data.Maybe<GsubGpos.Table>;
    base?: Data.Maybe<Base.Table>;
}
